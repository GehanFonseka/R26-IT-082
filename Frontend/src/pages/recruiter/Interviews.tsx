import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Table, Modal, Input } from '../../components/common/Components';
import { mockInterviews, mockJobs } from '../../data/mockData';
import { formatDate } from '../../utils/helpers';
import { Calendar, Plus } from 'lucide-react';

export const RecruiterInterviews: React.FC = () => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    candidateName: '',
    jobTitle: '',
    date: '',
    time: '',
  });

  const interviewsWithDetails = mockInterviews.map(interview => {
    const job = mockJobs.find(j => j.id === interview.jobId);
    return {
      id: interview.id,
      candidateId: interview.candidateId,
      jobId: interview.jobId,
      jobTitle: job?.title || 'N/A',
      candidateId: interview.candidateId,
      scheduledDate: interview.scheduledDate,
      status: interview.status,
    };
  });

  const columns = [
    { key: 'jobTitle', label: 'Job Position' },
    { key: 'candidateId', label: 'Candidate ID' },
    { key: 'scheduledDate', label: 'Scheduled Date' },
    { key: 'status', label: 'Status' },
  ];

  const tableData = interviewsWithDetails.map(int => ({
    ...int,
    status: int.status.charAt(0).toUpperCase() + int.status.slice(1),
  }));

  const handleSchedule = () => {
    console.log('Scheduling interview:', scheduleForm);
    setIsScheduleOpen(false);
    setScheduleForm({ candidateName: '', jobTitle: '', date: '', time: '' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Interviews</h1>
        <Button onClick={() => setIsScheduleOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          Schedule Interview
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={tableData} />
      </Card>

      {interviewsWithDetails.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600 text-lg">No interviews scheduled</p>
        </Card>
      )}

      {/* Schedule Interview Modal */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule Interview">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
            <Input
              value={scheduleForm.candidateName}
              onChange={e => setScheduleForm({ ...scheduleForm, candidateName: e.target.value })}
              placeholder="Enter candidate name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Position</label>
            <Input
              value={scheduleForm.jobTitle}
              onChange={e => setScheduleForm({ ...scheduleForm, jobTitle: e.target.value })}
              placeholder="Enter job position"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <Input
              type="date"
              value={scheduleForm.date}
              onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <Input
              type="time"
              value={scheduleForm.time}
              onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })}
            />
          </div>
          <div className="flex gap-4 justify-end mt-6">
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule}>Schedule</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
