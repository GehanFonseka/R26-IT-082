import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchScoreCard, RiskPredictionCard } from '../../components/ai';
import { AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import applicationService from '../../services/applicationService';
import aiService from '../../services/aiService';

export const ApplicationDetails: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<any>(null);
  const [matchData, setMatchData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch application details
        const appData = await applicationService.getApplications(1, 1, '', '', '');
        setApplication(appData.applications[0]);

        // Fetch AI insights
        if (applicationId) {
          const match = await aiService.getMatchScore(applicationId);
          setMatchData(match);

          const risk = await aiService.predictRisk(appData.applications[0].candidateId, appData.applications[0].jobId);
          setRiskData(risk);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [applicationId]);

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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Application Review</h1>
          <p className="text-gray-600 mt-1">{application?.candidateName} - {application?.jobTitle}</p>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* AI Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matchData && (
          <MatchScoreCard
            data={matchData}
            candidateName={application?.candidateName}
            jobTitle={application?.jobTitle}
          />
        )}
        {riskData && (
          <RiskPredictionCard
            data={riskData}
            candidateName={application?.candidateName}
            jobTitle={application?.jobTitle}
          />
        )}
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex gap-4"
      >
        <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
          ✓ Move to Next Stage
        </button>
        <button className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition">
          Schedule Interview
        </button>
        <button className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
          Reject
        </button>
      </motion.div>
    </div>
  );
};

export default ApplicationDetails;