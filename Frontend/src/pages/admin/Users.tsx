import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Table, Button, Input, Select } from '../../components/common/Components';
import { Edit, Trash2 } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'candidate', status: 'active' },
    { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', role: 'recruiter', status: 'active' },
    { id: '3', name: 'Mike Chen', email: 'mike@example.com', role: 'candidate', status: 'inactive' },
    { id: '4', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active' },
  ]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
  ];

  const tableData = users.map(user => ({
    ...user,
    role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    status: (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
        user.status === 'active'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {user.status}
      </span>
    ),
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
        <Button variant="primary">Add User</Button>
      </div>

      <Card>
        <div className="mb-6">
          <Input placeholder="Search users..." />
        </div>
        <Table
          columns={columns}
          data={tableData}
          actions={row => (
            <div className="flex gap-2">
              <Button variant="outline" className="p-2">
                <Edit size={16} />
              </Button>
              <Button variant="outline" className="p-2 text-red-600">
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        />
      </Card>
    </motion.div>
  );
};
