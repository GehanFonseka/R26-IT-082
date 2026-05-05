import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchScoreCard } from '../../components/ai';
import { Filter, Loader, AlertCircle, TrendingUp } from 'lucide-react';
import aiService from '../../services/aiService';

export const RecruiterCandidates: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const data = await aiService.getRankedCandidates(jobId!);
        setCandidates(data.candidates || data);
        setFilteredCandidates(data.candidates || data);
      } catch (err: any) {
        setError(err.message || 'Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchCandidates();
    }
  }, [jobId]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredCandidates(candidates);
    } else {
      setFilteredCandidates(
        candidates.filter((c) => c.matchScore?.match_level === filter)
      );
    }
  }, [filter, candidates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader className="w-12 h-12 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-900">Ranked Candidates</h1>
        <p className="text-gray-600 mt-2">AI-powered ranking by best fit</p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex items-center gap-4"
      >
        <Filter className="w-5 h-5 text-gray-600" />
        <div className="flex gap-2 flex-wrap">
          {['all', 'excellent', 'strong', 'moderate'].map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Candidate List */}
      <div className="space-y-6">
        {filteredCandidates.map((candidate, idx) => (
          <motion.div
            key={candidate.candidateId || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Candidate Info */}
            <motion.div
              whileHover={{ y: -2 }}
              className="lg:col-span-1 card p-6 cursor-pointer"
              onClick={() => setSelectedCandidate(candidate)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {candidate.candidateName || candidate.name}
                  </h3>
                  <p className="text-sm text-gray-600">Rank #{idx + 1}</p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </motion.div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-600">MATCH SCORE</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {candidate.matchScore?.overall_score || 0}%
                  </p>
                </div>

                {candidate.interviewScore && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs font-semibold text-purple-600">INTERVIEW</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {candidate.interviewScore}%
                    </p>
                  </div>
                )}

                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs font-semibold text-amber-600">RISK LEVEL</p>
                  <p className="text-lg font-bold text-amber-700 capitalize">
                    {candidate.riskLevel || 'N/A'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/recruiter/applications/${candidate.applicationId}`)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View Details
              </button>
            </motion.div>

            {/* Match Score Card */}
            {selectedCandidate?.candidateId === candidate.candidateId && candidate.matchScore && (
              <motion.div className="lg:col-span-2">
                <MatchScoreCard
                  data={candidate.matchScore}
                  candidateName={candidate.candidateName || candidate.name}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-12"
        >
          <p className="text-gray-600">No candidates found for this filter</p>
        </motion.div>
    </div>
  );
};

export default RecruiterCandidates;
