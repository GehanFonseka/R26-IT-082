import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, Briefcase, CheckCircle, AlertCircle, Loader, TrendingUp } from 'lucide-react';
import dashboardService from '../../services/dashboardService';

export const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    openPositions: 0,
    totalApplications: 0,
    shortlisted: 0,
    hired: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'recruiter') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboard = await dashboardService.getRecruiterDashboard();
        setStats({
          openPositions: dashboard.openPositions || 0,
          totalApplications: dashboard.totalApplications || 0,
          shortlisted: dashboard.shortlisted || 0,
          hired: dashboard.hired || 0,
        });
        setRecentApplications(dashboard.recentApplications || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (!user) return null;

  const statCards = [
    {
      icon: Briefcase,
      label: 'Open Positions',
      value: stats.openPositions,
      color: 'blue',
      action: () => navigate('/recruiter/vacancies'),
    },
    {
      icon: Users,
      label: 'Applications',
      value: stats.totalApplications,
      color: 'purple',
      action: () => navigate('/recruiter/applications'),
    },
    {
      icon: CheckCircle,
      label: 'Shortlisted',
      value: stats.shortlisted,
      color: 'green',
      action: () => navigate('/recruiter/candidates'),
    },
    {
      icon: TrendingUp,
      label: 'Hired',
      value: stats.hired,
      color: 'orange',
      action: null,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">AI-powered recruitment dashboard</p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {loading ? (
        <motion.div className="flex justify-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </motion.div>
      ) : (
        <>
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {statCards.map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                onClick={stat.action}
                className={`card bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 border-l-4 border-${stat.color}-600 cursor-pointer transition`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-12 h-12 text-${stat.color}-600 opacity-20`} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <motion.div
              whileHover={{ y: -4 }}
              className="card p-6 cursor-pointer"
              onClick={() => navigate('/recruiter/candidates')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">View Candidates</h3>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-gray-600 mb-4">
                Ranked candidates with AI-powered match scores
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Browse Candidates
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="card p-6 cursor-pointer"
              onClick={() => navigate('/recruiter/vacancies')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Manage Vacancies</h3>
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-gray-600 mb-4">Create and manage job openings</p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Go to Vacancies
              </button>
            </motion.div>
          </motion.div>

          {/* Recent Applications */}
          {recentApplications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Applications</h2>
                <button
                  onClick={() => navigate('/recruiter/applications')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentApplications.slice(0, 5).map((app) => (
                  <motion.div
                    key={app._id}
                    whileHover={{ x: 4 }}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition"
                    onClick={() => navigate(`/recruiter/applications/${app._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{app.candidateName}</h4>
                        <p className="text-sm text-gray-600">{app.jobTitle}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {app.matchScore && (
                          <div className="text-center">
                            <p className="text-xs font-semibold text-gray-600">MATCH</p>
                            <p className="text-2xl font-bold text-blue-600">{app.matchScore}%</p>
                          </div>
                        )}
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            app.status === 'shortlisted'
                              ? 'bg-green-100 text-green-700'
                              : app.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default RecruiterDashboard;
