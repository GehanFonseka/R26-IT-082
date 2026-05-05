import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { InterviewEvaluationCard } from '../../components/ai';
import { ArrowLeft, Download, Share2, Loader } from 'lucide-react';
import aiService from '../../services/aiService';

export const InterviewResults: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await aiService.evaluateInterview(interviewId!);
        setResult(data);
      } catch (err) {
        console.error('Failed to fetch results:', err);
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) fetchResults();
  }, [interviewId]);

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
        <h1 className="text-4xl font-bold text-gray-900">Interview Results</h1>
      </motion.div>

      {/* Result Summary */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card p-8 border-l-4 ${
            result.result === 'pass' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
          }`}
        >
          <div className="text-center">
            <p
              className={`text-6xl font-bold mb-2 ${result.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}
            >
              {result.overallScore}%
            </p>
            <p
              className={`text-2xl font-bold mb-4 ${result.result === 'pass' ? 'text-green-700' : 'text-red-700'}`}
            >
              {result.result === 'pass' ? 'PASSED' : 'FAILED'}
            </p>
            <p className="text-gray-700 text-lg">{result.recommendation}</p>
          </div>
        </motion.div>
      )}

      {/* Evaluation Card */}
      {result && (
        <InterviewEvaluationCard data={result} isLoading={loading} />
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex gap-4"
      >
        <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          Download Results
        </button>
        <button className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2">
          <Share2 className="w-5 h-5" />
          Share with Recruiter
        </button>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">Next Steps</h3>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </span>
            <div>
              <p className="font-semibold text-gray-800">Review Your Feedback</p>
              <p className="text-gray-600 text-sm">Check the strengths and areas for improvement above</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </span>
            <div>
              <p className="font-semibold text-gray-800">Wait for Recruiter Decision</p>
              <p className="text-gray-600 text-sm">You'll hear back within 5 business days</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </span>
            <div>
              <p className="font-semibold text-gray-800">Continue Exploring</p>
              <p className="text-gray-600 text-sm">Apply to more opportunities while you wait</p>
            </div>
          </li>
        </ol>
      </motion.div>
    </div>
  );
};

export default InterviewResults;
