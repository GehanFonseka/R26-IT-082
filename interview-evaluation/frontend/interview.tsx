// interview.tsx

import React, { useMemo, useState } from 'react';

type InterviewNote = {
  id: number;
  title: string;
  status: 'Pending' | 'Reviewed' | 'Archived';
};

const initialNotes: InterviewNote[] = [
  { id: 1, title: 'Interview preparation checklist', status: 'Pending' },
  { id: 2, title: 'Candidate communication notes', status: 'Reviewed' },
  { id: 3, title: 'Assessment follow-up', status: 'Archived' },
];

const Interview: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'All' | InterviewNote['status']>('All');

  const filteredNotes = useMemo(() => {
    if (activeFilter === 'All') return initialNotes;

    return initialNotes.filter(note => note.status === activeFilter);
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Interview Workspace
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage interview preparation and review information.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(['All', 'Pending', 'Reviewed', 'Archived'] as const).map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-md border px-4 py-2 text-sm transition ${
                activeFilter === filter
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Interview Notes
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {note.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Reference #{note.id.toString().padStart(3, '0')}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {note.status}
                </span>
              </div>
            ))}

            {filteredNotes.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                No interview records found.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-800">
            Interview Summary
          </h3>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {initialNotes.length}
              </p>
            </div>

            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Reviewed</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {initialNotes.filter(note => note.status === 'Reviewed').length}
              </p>
            </div>

            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {initialNotes.filter(note => note.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;