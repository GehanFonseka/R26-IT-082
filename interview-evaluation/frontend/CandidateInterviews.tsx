/**
 * Candidate view: interviews with AI communication/behavioral analysis and credential validation when present.
 * Mirrors: Frontend/src/pages/candidate/Interviews.tsx (structure / data shape).
 */
import React, { useCallback, useEffect, useState } from 'react';
import interviewClient from './interviewService';

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

              {row.status === 'scheduled' && (
                <button
                  type="button"
                  className="shrink-0 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Start interview
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CandidateInterviews;
