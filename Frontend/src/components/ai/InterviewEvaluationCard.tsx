import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, MessageSquare, ChevronDown } from 'lucide-react';
import aiService, { InterviewResult } from '../../services/aiService';

interface InterviewEvaluationCardProps {
  data: InterviewResult;
  candidateName?: string;
  isLoading?: boolean;
}

export const InterviewEvaluationCard: React.FC<InterviewEvaluationCardProps> = ({
  data,
  candidateName = 'Candidate',
  isLoading = false,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  if (isLoading) {
    return (
      <motion.div className="card animate-pulse">
        <div className="h-full bg-gray-200 rounded"></div>
      </motion.div>
    );
  }

  const getResultColor = (result: string): { bg: string; text: string; border: string } => {
    if (result === 'pass') {
      return {
        bg: 'from-green-500 to-emerald-500',
        text: 'text-green-700',
        border: 'border-green-300',
      };
    }
    return {
      bg: 'from-red-500 to-pink-500',
      text: 'text-red-700',
      border: 'border-red-300',
    };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'from-green-500 to-emerald-500';
    if (score >= 70) return 'from-blue-500 to-cyan-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    if (score >= 40) return 'from-red-500 to-pink-500';
    return 'from-red-700 to-red-600';
  };

  const ScoreGauge: React.FC<{ score: number; label: string }> = ({ score, label }) => (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={score >= 70 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 283} 283`}
            initial={{ strokeDasharray: '0 283' }}
            animate={{ strokeDasharray: `${(score / 100) * 283} 283` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-800">{Math.round(score)}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-gray-600">{label}</p>
    </div>
  );

  const resultColors = getResultColor(data.result);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${resultColors.bg} flex items-center justify-center`}>
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Interview Evaluation</h3>
            <p className="text-sm text-gray-500">{candidateName}</p>
          </div>
        </div>
      </div>

      {/* Result Banner */}
      <div className={`bg-gradient-to-r ${resultColors.bg} rounded-lg p-6 text-white`}>
        <p className="text-white/80 text-sm font-medium mb-2">Interview Result</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold mb-2">
              {data.overallScore}
              <span className="text-lg font-semibold opacity-90">/100</span>
            </p>
            <div className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur border border-white/30">
              <p className="text-sm font-semibold uppercase">
                {data.result === 'pass' ? '✓ PASSED' : '✗ FAILED'}
              </p>
            </div>
          </div>
          <p className="text-white/70 text-sm italic max-w-xs">{data.recommendation}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Evaluation Scores</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ScoreGauge score={data.overallScore} label="Overall" />
          {data.evaluations.length > 0 && (
            <>
              <ScoreGauge
                score={
                  data.evaluations.reduce((sum, e) => sum + e.communication_score, 0) /
                  data.evaluations.length
                }
                label="Communication"
              />
              <ScoreGauge
                score={
                  data.evaluations.reduce((sum, e) => sum + e.confidence_score, 0) /
                  data.evaluations.length
                }
                label="Confidence"
              />
              <ScoreGauge
                score={
                  data.evaluations.reduce((sum, e) => sum + e.clarity_score, 0) /
                  data.evaluations.length
                }
                label="Clarity"
              />
              <ScoreGauge
                score={
                  data.evaluations.reduce((sum, e) => sum + e.relevance_score, 0) /
                  data.evaluations.length
                }
                label="Relevance"
              />
            </>
          )}
        </div>
      </div>

      {/* Overall Feedback */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Overall Feedback</h4>
        <p className="text-sm text-gray-700 leading-relaxed">{data.feedback.overall}</p>

        {/* Strengths */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <h5 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Strengths
          </h5>
          <ul className="space-y-1">
            {data.feedback.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 mt-1">▸</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <h5 className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Areas for Improvement
          </h5>
          <ul className="space-y-1">
            {data.feedback.improvements.map((improvement, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-amber-600 mt-1">▸</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Questions Review */}
      {data.evaluations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Questions Review</h4>
          <div className="space-y-2">
            {data.evaluations.map((evaluation, idx) => (
              <motion.div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <motion.button
                  onClick={() =>
                    setExpandedQuestion(expandedQuestion === idx ? null : idx)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        evaluation.overall_score >= 70 ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                    />
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Question {evaluation.questionIndex + 1}
                      </p>
                      <p className="text-xs text-gray-500">Score: {evaluation.overall_score}/100</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedQuestion === idx ? 'rotate-180' : ''
                    }`}
                  />
                </motion.button>

                <AnimatePresence>
                  {expandedQuestion === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-4 border-t border-gray-200 bg-gray-50 space-y-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">QUESTION</p>
                        <p className="text-sm text-gray-700">{evaluation.question}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">YOUR ANSWER</p>
                        <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-300">
                          {evaluation.candidateAnswer}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-white p-2 rounded border border-gray-300">
                          <p className="text-xs text-gray-500 font-medium">Communication</p>
                          <p className="text-lg font-bold text-gray-800">
                            {evaluation.communication_score}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-300">
                          <p className="text-xs text-gray-500 font-medium">Confidence</p>
                          <p className="text-lg font-bold text-gray-800">
                            {evaluation.confidence_score}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-300">
                          <p className="text-xs text-gray-500 font-medium">Clarity</p>
                          <p className="text-lg font-bold text-gray-800">
                            {evaluation.clarity_score}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-300">
                          <p className="text-xs text-gray-500 font-medium">Relevance</p>
                          <p className="text-lg font-bold text-gray-800">
                            {evaluation.relevance_score}
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-1">FEEDBACK</p>
                        <p className="text-sm text-blue-800">{evaluation.feedback}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InterviewEvaluationCard;
