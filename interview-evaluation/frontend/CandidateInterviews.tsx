/**
 * Candidate view: list interviews and evaluation scores when completed.
 * Mirrors: Frontend/src/pages/candidate/Interviews.tsx (structure / data shape).
 */
import React from 'react';

type Row = {
  id: string;
  jobTitle: string;
  company: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scores?: { technical: number; communication: number; confidence: number };
};

const MOCK_ROWS: Row[] = [
  {
    id: '1',
    jobTitle: 'Software Engineer',
    company: 'Acme Corp',
    scheduledDate: '2026-05-10',
    status: 'completed',
    scores: { technical: 82, communication: 78, confidence: 75 },
  },
  {
    id: '2',
    jobTitle: 'Frontend Developer',
    company: 'Beta Ltd',
    scheduledDate: '2026-05-15',
    status: 'scheduled',
  },
];

export const CandidateInterviews: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">Interviews</h1>
    <div className="space-y-4">
      {MOCK_ROWS.map(row => (
        <article
          key={row.id}
          className="rounded-lg border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{row.jobTitle}</h2>
              <p className="text-sm text-blue-600">{row.company}</p>
              <p className="mt-2 text-sm text-gray-600">Date: {row.scheduledDate}</p>
              <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium">
                {row.status.toUpperCase()}
              </span>
              {row.scores && (
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
                </dl>
              )}
            </div>
            {row.status === 'scheduled' && (
              <button
                type="button"
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Start Interview
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  </div>
);

export default CandidateInterviews;
