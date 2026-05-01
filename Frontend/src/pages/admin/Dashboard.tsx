import React from 'react';
import { motion } from 'framer-motion';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/common/Components';
import { Users, Briefcase, Lock, AlertTriangle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const stats = [
    { title: 'Total Users', value: 342, trend: 8, icon: <Users /> },
    { title: 'Active Recruiters', value: 45, trend: 5, icon: <Briefcase /> },
    { title: 'System Health', value: '99.8%', icon: <Lock />, color: 'green' as any },
    { title: 'Pending Issues', value: 3, trend: -2, icon: <AlertTriangle /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <StatCard {...stat} color={['blue', 'green', 'purple', 'orange'][idx] as any} />
          </motion.div>
        ))}
      </div>

      {/* System Status */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">System Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="font-medium text-gray-800">Database</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Operational</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="font-medium text-gray-800">API Server</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Operational</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="font-medium text-gray-800">Email Service</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Operational</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">Storage</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">Warning</span>
          </div>
        </div>
      </Card>

      {/* Recent Activities */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activities</h2>
        <div className="space-y-4">
          {[
            { action: 'New user registered', user: 'john@example.com', time: '2 hours ago' },
            { action: 'Job posted', company: 'Tech Corp', time: '5 hours ago' },
            { action: 'Admin role assigned', user: 'admin@example.com', time: '1 day ago' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">{(activity as any).user || (activity as any).company}</span>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
