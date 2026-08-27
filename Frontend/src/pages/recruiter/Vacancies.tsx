import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Input, Modal, Table, Badge } from '../../components/common/Components';
import { mockJobs } from '../../data/mockData';
import { formatDate } from '../../utils/helpers';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

export const RecruiterVacancies: React.FC = () => {
  const [jobs, setJobs] = useState(mockJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    jobType: 'Full-time',
  });

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ title: '', location: '', jobType: 'Full-time' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setJobs(jobs.map(j => (j.id === editingId ? { ...j, ...formData } : j)));
    } else {
      const newJob = {
        ...mockJobs[0],
        id: `job_${Date.now()}`,
        ...formData,
      };
      setJobs([...jobs, newJob]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  const tableData = jobs.map(job => ({
    title: job.title,
    location: job.location,
    type: <Badge variant="info">{job.jobType}</Badge>,
    applicants: job.applicants,
    postedDate: formatDate(job.postedDate),
  }));

  const columns = [
    { key: 'title', label: 'Job Title' },
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Type' },
    { key: 'applicants', label: 'Applicants' },
    { key: 'postedDate', label: 'Posted Date' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Vacancies</h1>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus size={20} />
          New Vacancy
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={tableData}
          actions={row => (
            <div className="flex gap-2">
              <Button variant="outline" className="p-2">
                <Users size={16} />
              </Button>
              <Button variant="outline" className="p-2" onClick={() => handleAdd()}>
                <Edit size={16} />
              </Button>
              <Button variant="outline" className="p-2 text-red-600" onClick={() => handleDelete(row.title)}>
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Vacancy' : 'Create New Vacancy'}>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Senior React Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <Input
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., San Francisco, CA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <select
              value={formData.jobType}
              onChange={e => setFormData({ ...formData, jobType: e.target.value })}
              className="input-field"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Remote</option>
            </select>
          </div>
          <div className="flex gap-4 justify-end mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Vacancy</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
