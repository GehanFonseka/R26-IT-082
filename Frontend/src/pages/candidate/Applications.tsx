import React from 'react';
import { motion } from 'framer-motion';
import { Card, Table, Badge } from '../../components/common/Components';
import { mockApplications, mockJobs, mockCandidates } from '../../data/mockData';
import { formatDate, getStatusColor } from '../../utils/helpers';

export const CandidateApplications: React.FC = () => {
  const applicationsWithDetails = mockApplications.map(app => {
    const job = mockJobs.find(j => j.id === app.jobId);
    return {
      id: app.id,
      jobTitle: job?.title || 'N/A',
      company: job?.company || 'N/A',
      status: app.status,
      appliedDate: app.appliedDate,
      aiScore: app.aiScore,
    };
  });

  const columns = [
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'company', label: 'Company' },
    { key: 'appliedDate', label: 'Applied Date' },
    { key: 'status', label: 'Status' },
    { key: 'aiScore', label: 'AI Match Score' },
  ];

  const tableData = applicationsWithDetails.map(app => ({
    ...app,
    appliedDate: formatDate(app.appliedDate),
    status: <Badge variant={app.status === 'rejected' ? 'danger' : app.status === 'shortlisted' ? 'success' : 'info'}>{app.status}</Badge>,
    aiScore: app.aiScore ? `${app.aiScore}%` : 'N/A',
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">My Applications</h1>

      <Card>
        <Table columns={columns} data={tableData} />
      </Card>

      {applicationsWithDetails.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600 text-lg">You haven't applied to any jobs yet</p>
        </Card>
      )}
    </motion.div>
  );
};
