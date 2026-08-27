import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/common/Components';
import { Briefcase, CheckCircle, Calendar, Award } from 'lucide-react';
import dashboardService from '../../services/dashboardService';

export const CandidateDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await dashboardService.getCandidateDashboard();
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = [
    { title: 'Applied Jobs', value: dashboardData?.applied || 0, trend: 5, icon: <Briefcase /> },
    { title: 'Shortlisted', value: dashboardData?.shortlisted || 0, trend: 33, icon: <CheckCircle /> },
    { title: 'Interviews', value: dashboardData?.interviews || 0, trend: 0, icon: <Calendar /> },
    { title: 'Offers', value: dashboardData?.offers || 0, trend: 100, icon: <Award /> },
  ];

  const recentActivity = dashboardData?.recentApplications || [];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <StatCard {...stat} color={['blue', 'green', 'purple', 'orange'][idx] as any} />
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
          {loading ? (
            <p className="text-gray-500">Loading activity...</p>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.status || 'Application Status'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">{activity.jobId?.title || 'Job Title'}</span>
                      <span className="text-xs text-gray-400">{new Date(activity.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
