import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '../../components/common/Components';
import { mockJobs } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { MapPin, DollarSign, Briefcase, ArrowLeft } from 'lucide-react';

export const JobDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applied, setApplied] = useState(false);

  const job = mockJobs.find(j => j.id === id);

  if (!job) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">Job not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Back</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary hover:underline font-medium"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <Card>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-2xl text-primary font-semibold mb-6">{job.company}</p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <MapPin className="text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-800">{job.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Salary</p>
                  <p className="font-semibold text-gray-800">
                    {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Job Type</p>
                  <p className="font-semibold text-gray-800">{job.jobType}</p>
                </div>
              </div>
            </div>
          </div>

          <Button variant="primary" size="lg" onClick={() => setApplied(true)} disabled={applied}>
            {applied ? '✓ Applied' : 'Apply Now'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">About This Job</h2>
        <p className="text-gray-700 leading-relaxed">{job.description}</p>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Required Skills</h2>
        <div className="flex flex-wrap gap-3">
          {job.requiredSkills.map(skill => (
            <Badge key={skill} variant="success" className="text-base">
              {skill}
            </Badge>
          ))}
        </div>
      </Card>

      {applied && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
        >
          ✓ Your application has been submitted successfully! Check your applications page for updates.
        </motion.div>
      )}
    </motion.div>
  );
};
