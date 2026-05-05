import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SkillAnalysisCard } from '../../components/ai';
import { Briefcase, CheckCircle, Calendar, Award, AlertCircle, Loader, Brain } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import candidateService from '../../services/candidateService';
import aiService from '../../services/aiService';
import type { CandidateSkillInsights } from '../../services/aiService';

export const CandidateDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [skillData, setSkillData] = useState<CandidateSkillInsights | null>(null);
  const [loading, setLoading] = useState({
    dashboard: true,
    skills: false,
  });
  const [errors, setErrors] = useState({
    dashboard: '',
    skills: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'candidate') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading((prev) => ({ ...prev, dashboard: true }));
        const data = await dashboardService.getCandidateDashboard();
        setDashboardData(data);
        setErrors((prev) => ({ ...prev, dashboard: '' }));
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          dashboard: err.message || 'Failed to load dashboard',
        }));
      } finally {
        setLoading((prev) => ({ ...prev, dashboard: false }));
      }
    };

    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  // Fetch Skill Analysis
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading((prev) => ({ ...prev, skills: true }));
        if (user?._id) {
          const data = await aiService.getSkillAnalysis(user._id);
          setSkillData(data);
        }
      } catch (err: any) {
        if (err.status !== 404) {
          setErrors((prev) => ({
            ...prev,
            skills: 'Could not load skill analysis',
          }));
        }
      } finally {
        setLoading((prev) => ({ ...prev, skills: false }));
      }
    };

    if (isAuthenticated && user?._id) {
      fetchSkills();
    }
  }, [isAuthenticated, user?._id]);

  const stats = [
    {
      title: 'Applied Jobs',
      value: dashboardData?.applied || 0,
      trend: 5,
      icon: <Briefcase />,
    },
    {
      title: 'Shortlisted',
      value: dashboardData?.shortlisted || 0,
      trend: 33,
      icon: <CheckCircle />,
    },
    {
      title: 'Interviews',
      value: dashboardData?.interviews || 0,
      trend: 0,
      icon: <Calendar />,
    },
    {
      title: 'Offers',
      value: dashboardData?.offers || 0,
      trend: 100,
      icon: <Award />,
    },
  ];

  const recentActivity = dashboardData?.recentApplications || [];

  if (loading.dashboard) {
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
        <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.name}! 👋</h1>
        <p className="text-gray-600 mt-2">Your AI-powered career dashboard</p>
      </motion.div>

      {/* Error Messages */}
      {errors.dashboard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Error Loading Dashboard</p>
            <p className="text-red-700 text-sm">{errors.dashboard}</p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <StatCard
              {...stat}
              color={['blue', 'green', 'purple', 'orange'][idx] as any}
            />
          </motion.div>
        ))}
      </div>

      {/* AI Skill Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {skillData ? (
            <SkillAnalysisCard data={skillData} isLoading={loading.skills} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 text-center"
            >
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Skill Profile</h3>
              <p className="text-gray-600 mb-4">
                Upload your resume for AI-powered skill analysis
              </p>
              <button
                onClick={() => navigate('/candidate/profile')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload Resume
              </button>
            </motion.div>
          )}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800">Quick Stats</h3>
          {skillData && (
            <>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-semibold text-blue-600">SKILL SCORE</p>
                <p className="text-2xl font-bold text-blue-700">{skillData.skillScore}%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs font-semibold text-purple-600">LEVEL</p>
                <p className="text-lg font-bold text-purple-700 capitalize">{skillData.experienceLevel}</p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Recent Applications */}
      {recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((app: any, idx: number) => (
              <motion.div
                key={idx}
                whileHover={{ x: 4 }}
                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:border-blue-300"
                onClick={() => navigate(`/candidate/applications/${app._id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{app.jobTitle}</p>
                    <p className="text-sm text-gray-600">{app.company}</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    {app.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CandidateDashboard;
