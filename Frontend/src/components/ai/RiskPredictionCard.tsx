import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingDown, Lightbulb } from 'lucide-react';
import aiService, { RiskPrediction } from '../../services/aiService';

interface RiskPredictionCardProps {
  data: RiskPrediction;
  candidateName?: string;
  jobTitle?: string;
  isLoading?: boolean;
}

export const RiskPredictionCard: React.FC<RiskPredictionCardProps> = ({
  data,
  candidateName = 'Candidate',
  jobTitle = 'Position',
  isLoading = false,
}) => {
  const [selectedRisk, setSelectedRisk] = useState<number | null>(null);

  if (isLoading) {
    return (
      <motion.div className="card animate-pulse">
        <div className="h-full bg-gray-200 rounded"></div>
      </motion.div>
    );
  }

  const getRiskLevelColor = (
    level: string
  ): { gradient: string; text: string; bg: string; border: string } => {
    switch (level) {
      case 'low':
        return {
          gradient: 'from-green-500 to-emerald-500',
          text: 'text-green-700',
          bg: 'bg-green-100',
          border: 'border-green-300',
        };
      case 'medium':
        return {
          gradient: 'from-amber-500 to-orange-500',
          text: 'text-amber-700',
          bg: 'bg-amber-100',
          border: 'border-amber-300',
        };
      case 'high':
        return {
          gradient: 'from-red-500 to-pink-500',
          text: 'text-red-700',
          bg: 'bg-red-100',
          border: 'border-red-300',
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          text: 'text-gray-700',
          bg: 'bg-gray-100',
          border: 'border-gray-300',
        };
    }
  };

  const getRiskFactorColor = (
    impact: string
  ): { bg: string; text: string; border: string } => {
    switch (impact) {
      case 'high':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' };
      case 'medium':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' };
      case 'low':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  const riskColors = getRiskLevelColor(data.riskLevel);

  const CircularProgress: React.FC<{ percentage: number; size?: number }> = ({
    percentage,
    size = 120,
  }) => {
    const circumference = 2 * Math.PI * 45;
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" className="transform -rotate-90">
        <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={
            percentage <= 40
              ? '#10b981'
              : percentage <= 70
                ? '#f59e0b'
                : '#ef4444'
          }
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percentage / 100) * circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (percentage / 100) * circumference }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <text
          x="60"
          y="65"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-gray-800"
        >
          {Math.round(percentage)}%
        </text>
      </svg>
    );
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
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${riskColors.gradient} flex items-center justify-center`}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Risk Assessment</h3>
            <p className="text-sm text-gray-500">
              {candidateName} ↔ {jobTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Level Banner */}
      <div className={`bg-gradient-to-br ${riskColors.gradient} rounded-lg p-6 text-white`}>
        <p className="text-white/80 text-sm font-medium mb-4">Overall Risk Level</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-4xl font-bold mb-2">{data.overallRiskScore}</p>
            <div className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur border border-white/30">
              <p className="text-sm font-semibold uppercase">{data.riskLevel} RISK</p>
            </div>
            <p className="text-white/70 text-xs mt-3">{data.recommendation}</p>
          </div>
          <div className="flex justify-center">
            <div className="w-32 h-32">
              <CircularProgress
                percentage={data.overallRiskScore}
                size={140}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-semibold text-blue-600 mb-1">ATTRITION PROBABILITY</p>
          <p className="text-3xl font-bold text-blue-700">
            {Math.round(data.attritionProbability * 100)}%
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Likelihood of leaving within first year
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs font-semibold text-purple-600 mb-1">PREDICTED TENURE</p>
          <p className="text-3xl font-bold text-purple-700">{data.predictedTenureMonths}</p>
          <p className="text-xs text-purple-600 mt-2">months (if hired)</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
          <p className="text-xs font-semibold text-indigo-600 mb-1">PREDICTION CONFIDENCE</p>
          <p className="text-3xl font-bold text-indigo-700">{data.confidenceScore}%</p>
          <p className="text-xs text-indigo-600 mt-2">model accuracy</p>
        </div>
      </div>

      {/* Risk Factors */}
      {data.topRiskFactors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Top Risk Factors ({data.topRiskFactors.length})
          </h4>
          <div className="space-y-3">
            {data.topRiskFactors.map((risk, idx) => {
              const factorColors = getRiskFactorColor(risk.impact);
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedRisk(selectedRisk === idx ? null : idx)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${factorColors.bg} ${factorColors.border} ${factorColors.text}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{risk.factor}</p>
                      <p className="text-xs mt-1">{risk.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold">{risk.riskScore}</p>
                      <p className="text-xs capitalize mt-1">{risk.impact} impact</p>
                    </div>
                  </div>

                  {/* Risk Score Bar */}
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${risk.riskScore}%`,
                      }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-2 rounded-full ${
                        risk.impact === 'high'
                          ? 'bg-red-500'
                          : risk.impact === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mitigation Strategies */}
      {data.mitigationStrategies.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-600" />
            Mitigation Strategies
          </h4>
          <div className="space-y-2">
            {data.mitigationStrategies.map((strategy, idx) => (
              <div key={idx} className="bg-white/70 rounded p-3 border border-emerald-200">
                <div className="flex items-start gap-2 mb-1">
                  <span className="font-semibold text-emerald-700 text-sm">
                    {strategy.factor}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      strategy.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : strategy.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {strategy.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{strategy.strategy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendation</h4>
        <div
          className={`inline-block px-4 py-2 rounded-full font-semibold text-sm mb-2 ${
            data.riskLevel === 'low'
              ? 'bg-green-100 text-green-700'
              : data.riskLevel === 'medium'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
          }`}
        >
          {data.riskLevel === 'low'
            ? '✓ RECOMMENDED TO HIRE'
            : data.riskLevel === 'medium'
              ? '⚠ PROCEED WITH CAUTION'
              : '✗ RECOMMENDED TO RECONSIDER'}
        </div>
        <p className="text-sm text-gray-700 mt-2">
          Based on the comprehensive risk analysis, this assessment provides guidance for hiring
          decision-making. Consider implementing recommended mitigation strategies if proceeding with
          this candidate.
        </p>
      </div>
    </motion.div>
  );
};

export default RiskPredictionCard;
