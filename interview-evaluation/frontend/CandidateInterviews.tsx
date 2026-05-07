/**
 * Candidate view: interviews with AI communication/behavioral analysis and credential validation when present.
 * Mirrors: Frontend/src/pages/candidate/Interviews.tsx (structure / data shape).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import interviewClient from './interviewService';

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type QuestionEntry = { id: string; text: string };

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export const CandidateInterviews: React.FC = () => {
  const [rows, setRows] = useState<Interview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<QuestionEntry[]>([]);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, string>>({});
  const [newQuestionText, setNewQuestionText] = useState('');
  const [submittingSession, setSubmittingSession] = useState(false);
  const [voiceSupported] = useState(Boolean(getSpeechRecognitionCtor()));
  const [listeningQuestionId, setListeningQuestionId] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await interviewClient.getInterviews();
      setRows(data.interviews || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load interviews');
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Seeds a completed interview with answers + certs to showcase AI + validation (in-memory API). */
  const runDemoEvaluation = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const candidateId = `cand_${Date.now()}`;
      const { interview } = await interviewClient.startInterview({
        applicationId: `app_${Date.now()}`,
        jobId: 'job_cloud_1',
        candidateId,
        jobTitle: 'Cloud Engineer',
        requiredSkills: ['aws', 'kubernetes', 'terraform'],
        certifications: [
          {
            name: 'AWS Certified Solutions Architect – Associate',
            issuer: 'AWS',
            issueYear: 2024,
            credentialId: 'AWS-DEMO-123456',
            skills: ['aws', 'architecture'],
          },
        ],
        questions: [{ id: 'q1', text: 'Describe a production incident you owned end-to-end.', type: 'text' }],
      });
      await interviewClient.submitAnswers(
        interview._id,
        [
          {
            questionId: 'q1',
            answer:
              'Our team faced an outage in the payment API. I coordinated with SRE and product. First I triaged logs and identified a bad deploy. I owned the rollback plan and communicated timelines to stakeholders. We pivoted to a canary release afterward. This was stressful but we met our SLA.',
            confidence: 78,
          },
        ],
        { jobTitle: 'Cloud Engineer', requiredSkills: ['aws', 'kubernetes', 'terraform'] }
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demo failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const closeSession = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListeningQuestionId(null);
    setActiveInterview(null);
    setSessionQuestions([]);
    setAnswersByQuestion({});
    setNewQuestionText('');
  };

  const openInterviewSession = (row: Interview) => {
    const questions = (row.questions || []).map((q, index) => ({
      id: q.id || `q_${index + 1}`,
      text: q.text || `Question ${index + 1}`,
    }));
    setActiveInterview(row);
    setSessionQuestions(questions);
    setAnswersByQuestion(
      (row.answers || []).reduce<Record<string, string>>((acc, answer) => {
        if (answer.questionId) acc[answer.questionId] = answer.answer || '';
        return acc;
      }, {})
    );
    setNewQuestionText('');
    setListeningQuestionId(null);
  };

  const addInterviewerQuestion = () => {
    const trimmed = newQuestionText.trim();
    if (!trimmed) return;
    const id = `manual_q_${Date.now()}`;
    setSessionQuestions(prev => [...prev, { id, text: trimmed }]);
    setNewQuestionText('');
  };

  const startVoiceCapture = (questionId: string) => {
    if (listeningQuestionId === questionId) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setListeningQuestionId(null);
      return;
    }

    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Please type the answer.');
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = event => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      if (!transcript.trim()) return;
      setAnswersByQuestion(prev => ({
        ...prev,
        [questionId]: [prev[questionId] || '', transcript.trim()].filter(Boolean).join(' ').trim(),
      }));
    };
    recognition.onerror = event => {
      setError(`Voice capture error: ${event.error}`);
      setListeningQuestionId(null);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setListeningQuestionId(current => (current === questionId ? null : current));
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setListeningQuestionId(questionId);
    recognition.start();
  };

  const submitInterviewSession = async () => {
    if (!activeInterview) return;
    const payload = sessionQuestions
      .map(q => ({
        questionId: q.id,
        answer: (answersByQuestion[q.id] || '').trim(),
        confidence: Math.min(95, Math.max(45, ((answersByQuestion[q.id] || '').split(/\s+/).filter(Boolean).length / 3) * 10)),
      }))
      .filter(a => a.answer.length > 0);

    if (payload.length === 0) {
      setError('Please answer at least one question before submitting.');
      return;
    }

    setSubmittingSession(true);
    setError(null);
    try {
      await interviewClient.submitAnswers(activeInterview._id, payload, {
        jobTitle: activeInterview.jobTitle,
        requiredSkills: activeInterview.requiredSkills || [],
        certifications: activeInterview.certifications || [],
      });
      closeSession();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit interview answers');
    } finally {
      setSubmittingSession(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-sm text-gray-600">
            Completed interviews show AI-derived communication and behavioral cues, soft-skill scores, and
            certification trust when credentials were provided.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            type="button"
            disabled={demoLoading}
            onClick={() => void runDemoEvaluation()}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {demoLoading ? 'Running demo…' : 'Run sample evaluation'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}</div>
      )}

      <div className="space-y-4">
        {rows.length === 0 && !error && (
          <p className="text-gray-500">No interviews in session. Use &quot;Run sample evaluation&quot; or your recruiter flow.</p>
        )}
        {rows.map(row => (
          <article key={row._id} className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{row.jobTitle || 'Interview'}</h2>
                <p className="text-sm text-blue-600">Job ID: {row.jobId}</p>
                <p className="mt-2 text-sm text-gray-600">Scheduled: {formatDate(row.scheduledAt)}</p>
                <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium capitalize">
                  {row.status}
                </span>

                {row.scores && row.status === 'completed' && (
                  <dl className="mt-4 flex flex-wrap gap-6 text-sm">
                    <div>
                      <dt className="text-gray-600">Technical</dt>
                      <dd className="text-lg font-bold">{row.scores.technical}/100</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Communication</dt>
                      <dd className="text-lg font-bold">{row.scores.communication}/100</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Confidence</dt>
                      <dd className="text-lg font-bold">{row.scores.confidence}/100</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Overall</dt>
                      <dd className="text-lg font-bold">{row.scores.overall}/100</dd>
                    </div>
                  </dl>
                )}

                {row.aiAnalysis && row.status === 'completed' && (
                  <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
                    <h3 className="font-semibold text-slate-900">AI analysis: communication & behavior</h3>
                    <p className="mt-2 text-slate-700">{row.aiAnalysis.summary}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase text-slate-500">Communication cues</p>
                        <p className="text-slate-800">
                          Clarity {row.aiAnalysis.communicationCues.clarity} · Structure{' '}
                          {row.aiAnalysis.communicationCues.structure} · Vocabulary{' '}
                          {row.aiAnalysis.communicationCues.vocabularyDepth}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-slate-500">Behavioral dimensions</p>
                        <p className="text-slate-800">
                          Teamwork {row.aiAnalysis.behavioralCues.dimensions.teamwork} · Ownership{' '}
                          {row.aiAnalysis.behavioralCues.dimensions.ownership} · Adaptability{' '}
                          {row.aiAnalysis.behavioralCues.dimensions.adaptability}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase text-slate-500">Soft skills</p>
                      <p className="text-slate-800">
                        Collaboration {row.aiAnalysis.softSkills.collaboration}/100 · Problem-solving{' '}
                        {row.aiAnalysis.softSkills.problemSolving}/100 · Professionalism{' '}
                        {row.aiAnalysis.softSkills.professionalism}/100
                      </p>
                    </div>
                  </div>
                )}

                {row.certificationValidation && (
                  <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50/80 p-3 text-sm">
                    <h3 className="font-semibold text-emerald-900">Credential validation</h3>
                    <p className="text-emerald-800">
                      Overall trust score: <strong>{row.certificationValidation.overallTrustScore}/100</strong>
                    </p>
                    <ul className="mt-2 space-y-2 text-emerald-900">
                      {row.certificationValidation.items.map((c, i) => (
                        <li key={i} className="border-t border-emerald-200/60 pt-2 first:border-t-0 first:pt-0">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-emerald-700"> — trust {c.trustScore}</span>
                          <div className="text-xs text-emerald-800/90">
                            Authenticity ({c.authenticity.level}): {c.authenticity.reasons[0]} · Relevance (
                            {c.relevance.level}) · Validity ({c.validity.level})
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {row.feedback && row.status === 'completed' && (
                  <p className="mt-3 text-sm text-gray-700">
                    <span className="font-medium">Summary: </span>
                    {row.feedback}
                  </p>
                )}
              </div>

              {(row.status === 'scheduled' || row.status === 'in-progress') && (
                <button
                  type="button"
                  onClick={() => openInterviewSession(row)}
                  className="shrink-0 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  {row.status === 'scheduled' ? 'Start interview' : 'Continue interview'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {activeInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{activeInterview.jobTitle || 'Interview'} session</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Interviewer asks questions and candidate answers using voice input or typing.
                </p>
              </div>
              <button type="button" onClick={closeSession} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
                Close
              </button>
            </div>

            {!voiceSupported && (
              <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Voice input is unavailable in this browser. You can still type answers manually.
              </p>
            )}

            <div className="mt-5 space-y-4">
              {sessionQuestions.length === 0 && (
                <p className="text-sm text-gray-500">
                  No preset questions found. Add interviewer questions below and capture candidate answers as voice.
                </p>
              )}
              {sessionQuestions.map((q, idx) => (
                <div key={q.id} className="rounded-md border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    Q{idx + 1}. {q.text}
                  </p>
                  <textarea
                    className="mt-2 h-28 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Candidate answer transcript appears here…"
                    value={answersByQuestion[q.id] || ''}
                    onChange={e => setAnswersByQuestion(prev => ({ ...prev, [q.id]: e.target.value }))}
                  />
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => startVoiceCapture(q.id)}
                      className="rounded border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                    >
                      {listeningQuestionId === q.id ? 'Stop voice capture' : 'Answer with voice'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-md border border-dashed border-gray-300 p-4">
              <p className="text-sm font-medium text-gray-900">Add interviewer question</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="Type a question asked by interviewer"
                />
                <button
                  type="button"
                  onClick={addInterviewerQuestion}
                  className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Add question
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeSession} className="rounded border border-gray-300 px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingSession}
                onClick={() => void submitInterviewSession()}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submittingSession ? 'Submitting…' : 'Submit answers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateInterviews;
