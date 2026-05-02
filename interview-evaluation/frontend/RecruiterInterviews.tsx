/**
 * Recruiter view: interview table and schedule modal pattern.
 * Mirrors: Frontend/src/pages/recruiter/Interviews.tsx (structure).
 */
import React, { useState } from 'react';

type TableRow = {
  id: string;
  jobTitle: string;
  candidateId: string;
  scheduledDate: string;
  status: string;
};

const MOCK_TABLE: TableRow[] = [
  {
    id: '1',
    jobTitle: 'Software Engineer',
    candidateId: 'user_101',
    scheduledDate: '2026-05-10',
    status: 'Completed',
  },
  {
    id: '2',
    jobTitle: 'Data Analyst',
    candidateId: 'user_102',
    scheduledDate: '2026-05-12',
    status: 'Scheduled',
  },
];

export const RecruiterInterviews: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    candidateName: '',
    jobTitle: '',
    date: '',
    time: '',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interviews</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Schedule Interview
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Job Position</th>
              <th className="px-4 py-2">Candidate ID</th>
              <th className="px-4 py-2">Scheduled Date</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TABLE.map(row => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{row.jobTitle}</td>
                <td className="px-4 py-2">{row.candidateId}</td>
                <td className="px-4 py-2">{row.scheduledDate}</td>
                <td className="px-4 py-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Schedule Interview</h2>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-gray-700">Candidate Name</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.candidateName}
                  onChange={e => setForm({ ...form, candidateName: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Job Position</span>
                <input
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.jobTitle}
                  onChange={e => setForm({ ...form, jobTitle: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Date</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label className="block text-sm">
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
                onClick={() => {
                  setModalOpen(false);
                  setForm({ candidateName: '', jobTitle: '', date: '', time: '' });
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterInterviews;
