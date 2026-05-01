import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Input, Badge, Modal } from '../../components/common/Components';
import { mockCandidates } from '../../data/mockData';
import { Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { getRiskColor } from '../../utils/helpers';

export const RecruiterCandidates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<(typeof mockCandidates)[0] | null>(null);

  const filteredCandidates = mockCandidates.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Candidates</h1>

      <Card>
        <Input placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate, idx) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="hover:shadow-lg cursor-pointer relative h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{candidate.name}</h3>
                  <p className="text-sm text-gray-600">{candidate.email}</p>
                </div>
                {candidate.riskLevel && (
                  <div className={`p-2 rounded ${getRiskColor(candidate.riskLevel)}`}>
                    {candidate.riskLevel === 'low' ? (
                      <CheckCircle size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="success">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 3 && (
                      <Badge variant="info">+{candidate.skills.length - 3}</Badge>
                    )}
                  </div>
                </div>

                {candidate.matchScore && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Match Score</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${candidate.matchScore}%` }}
                      />
                    </div>
                    <p className="text-sm font-bold text-gray-800 mt-1">{candidate.matchScore}%</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <Eye size={18} />
                  View Profile
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Candidate Detail Modal */}
      <Modal isOpen={!!selectedCandidate} onClose={() => setSelectedCandidate(null)} title="Candidate Profile">
        {selectedCandidate && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{selectedCandidate.name}</h3>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{selectedCandidate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800">{selectedCandidate.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-800">{selectedCandidate.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-semibold text-gray-800">{selectedCandidate.experience} years</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map(skill => (
                    <Badge key={skill} variant="success">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedCandidate.matchScore && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">Overall Match</span>
                    <span className="text-2xl font-bold text-primary">{selectedCandidate.matchScore}%</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${selectedCandidate.matchScore}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedCandidate.riskLevel && (
                <div className={`p-4 rounded-lg border mb-6 ${getRiskColor(selectedCandidate.riskLevel).replace('text-', 'border-').replace('bg-', 'bg-')}`}>
                  <p className="font-semibold">Risk Level: <span className="uppercase">{selectedCandidate.riskLevel}</span></p>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={() => setSelectedCandidate(null)} variant="secondary">
                  Close
                </Button>
                <Button variant="primary">Schedule Interview</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
