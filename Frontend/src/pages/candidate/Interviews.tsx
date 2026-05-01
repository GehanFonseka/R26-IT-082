import React from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '../../components/common/Components';
import { mockInterviews, mockJobs } from '../../data/mockData';
import { Calendar, Clock, Play } from 'lucide-react';

export const CandidateInterviews: React.FC = () => {
  const interviewsWithDetails = mockInterviews.map(interview => {
    const job = mockJobs.find(j => j.id === interview.jobId);
    return { ...interview, jobTitle: job?.title, company: job?.company };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Interviews</h1>

      <div className="space-y-4">
        {interviewsWithDetails.map((interview, idx) => (
          <motion.div
            key={interview.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="hover:shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{interview.jobTitle}</h3>
                  <p className="text-primary font-semibold mb-4">{interview.company}</p>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} />
                      <span>{interview.scheduledDate}</span>
                    </div>
                    <Badge
                      variant={
                        interview.status === 'completed'
                          ? 'success'
                          : interview.status === 'cancelled'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {interview.status.toUpperCase()}
                    </Badge>
                  </div>

                  {interview.scores && (
                    <div className="flex gap-6 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600">Technical</p>
                        <p className="font-bold text-lg text-primary">{interview.scores.technical}/100</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Communication</p>
                        <p className="font-bold text-lg text-primary">{interview.scores.communication}/100</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Confidence</p>
                        <p className="font-bold text-lg text-primary">{interview.scores.confidence}/100</p>
                      </div>
                    </div>
                  )}
                </div>

                {interview.status === 'scheduled' && (
                  <Button variant="primary" className="flex items-center gap-2">
                    <Play size={18} />
                    Start Interview
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {interviewsWithDetails.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600 text-lg">No interviews scheduled</p>
        </Card>
      )}
    </motion.div>
  );
};
