import React from 'react';
import { motion } from 'framer-motion';
import { Card, Table, Select } from '../../components/common/Components';

export const AdminLogs: React.FC = () => {
  const logs = [
    { id: '1', action: 'User login', user: 'john@example.com', timestamp: '2024-05-01 10:30 AM', status: 'success' },
    { id: '2', action: 'Job created', user: 'recruiter@example.com', timestamp: '2024-05-01 09:15 AM', status: 'success' },
    { id: '3', action: 'Failed login attempt', user: 'unknown@example.com', timestamp: '2024-05-01 08:45 AM', status: 'error' },
    { id: '4', action: 'User role updated', user: 'admin@example.com', timestamp: '2024-05-01 07:20 AM', status: 'success' },
  ];

  const columns = [
    { key: 'action', label: 'Action' },
    { key: 'user', label: 'User' },
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'status', label: 'Status' },
  ];

  const tableData = logs.map(log => ({
    ...log,
    status: (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
        log.status === 'success'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {log.status}
      </span>
    ),
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">System Logs</h1>

      <Card>
        <div className="mb-6">
          <Select
            options={[
              { value: 'all', label: 'All Actions' },
              { value: 'login', label: 'Login' },
              { value: 'job', label: 'Job Operations' },
              { value: 'user', label: 'User Management' },
            ]}
          />
        </div>
        <Table columns={columns} data={tableData} />
      </Card>
    </motion.div>
  );
};
