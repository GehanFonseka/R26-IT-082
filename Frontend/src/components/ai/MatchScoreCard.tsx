import React from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import aiService, { MatchScoreDetails } from '../../services/aiService';

interface MatchScoreCardProps {
  data: MatchScoreDetails;
  candidateName?: string;
  jobTitle?: string;
  isLoading?: boolean;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({
  data,
  candidateName = 'Candidate',
  jobTitle = 'Position',
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <motion.div className="card animate-pulse">
        <div className="h-full bg-gray-200 rounded"></div>
      </motion.div>
    );
  }

  const getMatchLevelBgColor = (level: string): string => {
    switch (level) {
      case 'excellent':
        return 'from-green-500 to-emerald-500';
      case 'strong':
        return 'from-blue-500 to-cyan-500';
      case 'moderate':
        return 'from-amber-500 to-orange-500';
      case 'weak':
        return 'from-red-500 to-pink-500';
      case 'poor':
        return 'from-red-700 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getMatchLevelTextColor = (level: string): string => {
    switch (level) {
      case 'excellent':
        return 'text-green-700 bg-green-100 border-green-300';
      case 'strong':
        return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'moderate':
        return 'text-amber-700 bg-amber-100 border-amber-300';
      case 'weak':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'poor':
        return 'text-red-800 bg-red-200 border-red-400';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const ProgressBar: React.FC<{ score: number; color: string }> = ({ score, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`h-2 rounded-full bg-gradient-to-r ${color}`}
      />
    </div>
  );

  const dimensionColorGradients: Record<string, string> = {
    skills: 'from-blue-500 to-cyan-500',
    experience: 'from-purple-500 to-pink-500',
    education: 'from-indigo-500 to-blue-500',
    location: 'from-teal-500 to-green-500',
    salary: 'from-amber-500 to-orange-500',
    cultural_fit: 'from-rose-500 to-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getMatchLevelBgColor(data.match_level)} flex items-center justify-center`}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Match Analysis</h3>
            <p className="text-sm text-gray-500">
              {candidateName} ↔ {jobTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Match Score */}
      <div className={`bg-gradient-to-br ${getMatchLevelBgColor(data.match_level)} rounded-lg p-6 text-white`}>
        <p className="text-white/80 text-sm font-medium mb-2">Overall Match Score</p>
        <div className="flex items-baseline gap-2">
          <p className="text-5xl font-bold">{data.overall_score}</p>
          <p className="text-xl font-semibold opacity-90">/100</p>
        </div>
        <div className="mt-4 inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur border border-white/30">
          <p className="text-sm font-semibold capitalize">{data.match_level.toUpperCase()} MATCH</p>
        </div>
        <p className="text-white/70 text-xs mt-3 italic">{data.summary}</p>
      </div>

      {/* Match Dimensions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Match Breakdown</h4>
        <div className="space-y-4">
          {Object.entries(data.dimensions).map(([key, dimension]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 capitalize">
                    {dimension.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{dimension.explanation}</p>
                </div>
                <div className="ml-4">
                  <span className="text-lg font-bold text-gray-800">{dimension.score}</span>
                </div>
              </div>
              <ProgressBar
                score={dimension.score}
                color={dimensionColorGradients[key] || 'from-gray-500 to-gray-600'}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Matched Skills */}
      {data.top_matched_skills.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Matched Skills ({data.top_matched_skills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.top_matched_skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {data.skill_gaps.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Skill Gaps ({data.skill_gaps.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.skill_gaps.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300"
              >
                ○ {skill}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-3">
            These skills can be developed through training and onboarding
          </p>
        </div>
      )}

      {/* Confidence Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Prediction Confidence
          </p>
          <p className="text-sm font-bold text-blue-600">{data.confidence}%</p>
        </div>
        <ProgressBar score={data.confidence} color="from-blue-500 to-indigo-500" />
      </div>
    </motion.div>
  );
};

export default MatchScoreCard;
