import React from 'react';
import { motion } from 'framer-motion';
import { StatCard, ChartCard } from '../../components/dashboard/StatCard';
import { Card, Badge } from '../../components/common/Components';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Briefcase, CheckCircle, TrendingUp } from 'lucide-react';

export const RecruiterDashboard: React.FC = () => {
  const stats = [
    { title: 'Total Applicants', value: 148, trend: 12, icon: <Users /> },
    { title: 'Shortlisted', value: 32, trend: 8, icon: <CheckCircle /> },
    { title: 'Open Positions', value: 5, trend: -2, icon: <Briefcase /> },
    { title: 'Hired This Month', value: 3, trend: 50, icon: <TrendingUp /> },
  ];

  const applicationsData = [
    { month: 'Jan', applications: 45 },
    { month: 'Feb', applications: 52 },
    { month: 'Mar', applications: 38 },
    { month: 'Apr', applications: 65 },
  ];

  const funnel = [
    { name: 'Applied', value: 150, fill: '#00D4FF' },
    { name: 'Shortlisted', value: 45, fill: '#0172B2' },
    { name: 'Interview', value: 20, fill: '#001645' },
    { name: 'Offered', value: 5, fill: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Recruiter Dashboard</h1>

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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Applications Over Time">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={applicationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#0172B2"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hiring Funnel">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0172B2" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: 'New application from John Doe', role: 'Senior React Developer', time: '2 hours ago' },
            { action: 'Interview scheduled with Sarah Smith', role: 'Product Manager', time: '5 hours ago' },
            { action: 'Offer extended to Mike Chen', role: 'Data Scientist', time: '1 day ago' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">{activity.role}</Badge>
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
