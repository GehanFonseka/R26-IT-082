import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Award } from 'lucide-react';
import aiService, { CandidateSkillInsights } from '../../services/aiService';

interface SkillAnalysisCardProps {
  data: CandidateSkillInsights;
  isLoading?: boolean;
}

export const SkillAnalysisCard: React.FC<SkillAnalysisCardProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <motion.div className="card animate-pulse">
        <div className="h-full bg-gray-200 rounded"></div>
      </motion.div>
    );
  }

  const getSkillColor = (level: string): string => {
    switch (level) {
      case 'advanced':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'beginner':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getExperienceLevelColor = (level: string): string => {
    switch (level) {
      case 'lead':
        return 'from-purple-600 to-purple-400';
      case 'senior':
        return 'from-indigo-600 to-indigo-400';
      case 'mid':
        return 'from-blue-600 to-blue-400';
      case 'junior':
        return 'from-cyan-600 to-cyan-400';
      case 'entry':
        return 'from-emerald-600 to-emerald-400';
      default:
        return 'from-gray-600 to-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Skill Analysis</h3>
            <p className="text-sm text-gray-500">AI-Powered Resume Analysis</p>
          </div>
        </div>
      </div>

      {/* Skill Score Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-gray-600 text-sm font-medium mb-1">Skill Score</p>
          <p className="text-3xl font-bold text-blue-600">{data.skillScore}</p>
          <p className="text-xs text-blue-500 mt-1">out of 100</p>
        </div>

        <div className={`bg-gradient-to-br ${getExperienceLevelColor(data.experienceLevel)} rounded-lg p-4 border border-gray-200 text-white`}>
          <p className="text-white/80 text-sm font-medium mb-1">Experience Level</p>
          <p className="text-2xl font-bold capitalize">{data.experienceLevel}</p>
        </div>
      </div>

      {/* Top Skills */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Top Skills
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.skills.slice(0, 8).map((skill, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getSkillColor(skill.proficiencyLevel)} transition-all`}
            >
              {skill.skill}
              <span className="ml-1 text-xs opacity-75">•</span>
              <span className="ml-1 text-xs opacity-75 capitalize">{skill.proficiencyLevel}</span>
            </motion.div>
          ))}
          {data.skills.length > 8 && (
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              +{data.skills.length - 8} more
            </div>
          )}
        </div>
      </div>

      {/* Skill Recommendations */}
      {data.skillRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Recommendations to Grow
          </h4>
          <ul className="space-y-2">
            {data.skillRecommendations.slice(0, 3).map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills by Category */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Skills by Category</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(data.skillAnalysis).map(([category, skills]) => (
            skills.length > 0 && (
              <div key={category} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2 capitalize">
                  {category.replace(/_/g, ' ')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded bg-white border border-gray-300 text-gray-700"
                    >
                      {skill.skill}
                    </span>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SkillAnalysisCard;
