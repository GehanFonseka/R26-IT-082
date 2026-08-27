import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Input } from '../../components/common/Components';
import { Badge } from '../../components/common/Components';
import { mockJobs } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { MapPin, Briefcase, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CandidateJobs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedJobType || job.jobType === selectedJobType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Available Jobs</h1>

      {/* Filters */}
      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            placeholder="Search jobs or companies..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            value={selectedJobType}
            onChange={e => setSelectedJobType(e.target.value)}
            className="input-field"
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
      </Card>

      {/* Job Cards */}
      <div className="space-y-4">
        {filteredJobs.map((job, idx) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="hover:shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <Link to={`/candidate/jobs/${job.id}`}>
                    <h3 className="text-xl font-bold text-gray-800 hover:text-primary cursor-pointer">{job.title}</h3>
                  </Link>
                  <p className="text-primary font-semibold">{job.company}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} />
                      <span>{formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase size={16} />
                      <Badge variant="info">{job.jobType}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.requiredSkills.map(skill => (
                      <Badge key={skill} variant="success">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 mt-4">
                    Posted {formatDate(job.postedDate)} • {job.applicants} applicants
                  </p>
                </div>

                <Link to={`/candidate/jobs/${job.id}`}>
                  <Button variant="primary">View & Apply</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600 text-lg">No jobs found matching your criteria</p>
        </Card>
      )}
    </div>
  );
};
