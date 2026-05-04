/**
 * Recruiter view: interviews list with credential trust and AI-assisted assessment summary.
 * Mirrors: Frontend/src/pages/recruiter/Interviews.tsx (structure).
 */
import React, { useCallback, useEffect, useState } from 'react';
import interviewClient, {
  type CertificationInput,
  type CertificationValidation,
  type Interview,
} from './interviewService';

function formatShort(iso: string | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const RecruiterInterviews: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [rows, setRows] = useState<Interview[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Interview | null>(null);
  const [form, setForm] = useState({
    candidateId: '',
    jobId: '',
    applicationId: '',
    jobTitle: '',
    scheduledDate: '',
    time: '',
    requiredSkills: '',
  });
  const [certForm, setCertForm] = useState({
    jobTitle: '',
    requiredSkills: '',
    jsonCerts: `[
  { "name": "AWS Solutions Architect", "issuer": "AWS", "issueYear": 2024, "credentialId": "ABC123" }
]`,
  });
  const [certResult, setCertResult] = useState<CertificationValidation | null>(null);
  const [certLoading, setCertLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await interviewClient.getInterviews();
      setRows(data.interviews || []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load interviews');
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSchedule = async () => {
    if (!form.candidateId || !form.jobId || !form.scheduledDate) return;
    const scheduledAt = `${form.scheduledDate}T${form.time || '09:00'}:00`;
    const requiredSkills = form.requiredSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    try {
      await interviewClient.scheduleInterview(
        form.candidateId,
        form.jobId,
        form.applicationId || form.candidateId,
        scheduledAt,
        [],
        { jobTitle: form.jobTitle, requiredSkills }
      );
      setModalOpen(false);
      setForm({
        candidateId: '',
        jobId: '',
        applicationId: '',
        jobTitle: '',
        scheduledDate: '',
        time: '',
        requiredSkills: '',
      });
      await refresh();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Schedule failed');
    }
  };

  const runCertValidation = async () => {
    let certs: CertificationInput[];
    try {
      certs = JSON.parse(certForm.jsonCerts) as CertificationInput[];
      if (!Array.isArray(certs)) throw new Error('Expected a JSON array');
    } catch {
      setLoadError('Invalid JSON for certifications');
      return;
    }
    const requiredSkills = certForm.requiredSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    setCertLoading(true);
    setLoadError(null);
    try {
      const { certificationValidation } = await interviewClient.validateCertifications(
        certs,
        certForm.jobTitle,
        requiredSkills
      );
      setCertResult(certificationValidation);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Validation failed');
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-sm text-gray-600">
            AI-assisted communication and behavioral analysis on completion; credential trust scores when
            certificates are supplied.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCertModalOpen(true)}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Validate certifications
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Schedule interview
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{loadError}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Role / job</th>
              <th className="px-4 py-2">Candidate</th>
              <th className="px-4 py-2">Scheduled</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Credential trust</th>
              <th className="px-4 py-2">AI soft-skill pulse</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No interviews yet. Schedule one or start an interview from the candidate flow.
                </td>
              </tr>
            )}
            {rows.map(row => (
              <tr key={row._id} className="border-t border-gray-100">
                <td className="px-4 py-2">{row.jobTitle || row.jobId}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.candidateId}</td>
                <td className="px-4 py-2">{formatShort(row.scheduledAt)}</td>
                <td className="px-4 py-2 capitalize">{row.status}</td>
                <td className="px-4 py-2">
                  {row.certificationValidation ? (
                    <span className="font-semibold text-emerald-700">
                      {row.certificationValidation.overallTrustScore}/100
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {row.aiAnalysis?.softSkills ? (
                    <span className="text-gray-800">
                      C {row.aiAnalysis.softSkills.collaboration} · PS {row.aiAnalysis.softSkills.problemSolving}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => setSelected(row)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Interview assessment</h2>
            <p className="mt-1 text-xs text-gray-500">ID: {selected._id}</p>
            {selected.scores && (
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-600">Technical</dt>
                <dd className="font-bold">{selected.scores.technical}</dd>
                <dt className="text-gray-600">Communication</dt>
                <dd className="font-bold">{selected.scores.communication}</dd>
                <dt className="text-gray-600">Overall</dt>
                <dd className="font-bold">{selected.scores.overall}</dd>
              </dl>
            )}
            {selected.aiAnalysis && (
              <div className="mt-4 border-t pt-4 text-sm">
                <h3 className="font-medium text-gray-900">AI analysis (communication & behavior)</h3>
                <p className="mt-2 text-gray-700">{selected.aiAnalysis.summary}</p>
                <ul className="mt-2 list-inside list-disc text-gray-600">
                  {selected.aiAnalysis.communicationCues.signals.slice(0, 4).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-gray-500">Method: {selected.aiAnalysis.analysisMethod}</p>
              </div>
            )}
            {selected.certificationValidation && (
              <div className="mt-4 border-t pt-4 text-sm">
                <h3 className="font-medium text-gray-900">Certification validation</h3>
                <p className="mt-1 text-gray-700">
                  Overall trust:{' '}
                  <strong>{selected.certificationValidation.overallTrustScore}/100</strong>
                </p>
                <ul className="mt-2 space-y-2">
                  {selected.certificationValidation.items.map((c, i) => (
                    <li key={i} className="rounded bg-gray-50 p-2">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-600">
                        Authenticity: {c.authenticity.level} ({c.authenticity.score}) · Relevance:{' '}
                        {c.relevance.level} ({c.relevance.score}) · Validity: {c.validity.level} ({c.validity.score})
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Schedule interview</h2>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-gray-700">Candidate ID</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.candidateId}
                  onChange={e => setForm({ ...form, candidateId: e.target.value })}
                  placeholder="user_101"
                />
              </label>
              <label className="block">
                <span className="text-gray-700">Job ID</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.jobId}
                  onChange={e => setForm({ ...form, jobId: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-gray-700">Application ID (optional)</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.applicationId}
                  onChange={e => setForm({ ...form, applicationId: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-gray-700">Job title (for relevance scoring)</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.jobTitle}
                  onChange={e => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="Senior Backend Engineer"
                />
              </label>
              <label className="block">
                <span className="text-gray-700">Required skills (comma-separated)</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.requiredSkills}
                  onChange={e => setForm({ ...form, requiredSkills: e.target.value })}
                  placeholder="aws, node, kubernetes"
                />
              </label>
              <label className="block">
                <span className="text-gray-700">Date</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-gray-700">Time</span>
                <input
                  type="time"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-blue-600 px-4 py-2 text-white"
                onClick={() => void handleSchedule()}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {certModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Certification validation</h2>
            <p className="mt-1 text-sm text-gray-600">
              Checks authenticity (issuer signals), relevance to role keywords, and validity (dates).
            </p>
            <label className="mt-4 block text-sm">
              <span className="text-gray-700">Job title</span>
              <input
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                value={certForm.jobTitle}
                onChange={e => setCertForm({ ...certForm, jobTitle: e.target.value })}
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="text-gray-700">Required skills (comma-separated)</span>
              <input
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                value={certForm.requiredSkills}
                onChange={e => setCertForm({ ...certForm, requiredSkills: e.target.value })}
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="text-gray-700">Certifications (JSON array)</span>
              <textarea
                className="mt-1 h-40 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
                value={certForm.jsonCerts}
                onChange={e => setCertForm({ ...certForm, jsonCerts: e.target.value })}
              />
            </label>
            {certResult && (
              <div className="mt-4 rounded border border-emerald-100 bg-emerald-50 p-3 text-sm">
                <p className="font-medium text-emerald-900">
                  Overall trust: {certResult.overallTrustScore}/100
                </p>
                <ul className="mt-2 space-y-1 text-emerald-900">
                  {certResult.items.map((c, i) => (
                    <li key={i}>
                      {c.name}: trust {c.trustScore} — {c.authenticity.level} / {c.relevance.level} /{' '}
                      {c.validity.level}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2"
                onClick={() => {
                  setCertModalOpen(false);
                  setCertResult(null);
                }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={certLoading}
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                onClick={() => void runCertValidation()}
              >
                {certLoading ? 'Running…' : 'Run validation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterInterviews;
