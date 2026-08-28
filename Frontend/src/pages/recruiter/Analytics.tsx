import React from 'react';
import { motion } from 'framer-motion';
import { ChartCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/common/Components';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
} from 'recharts';

export const RecruiterAnalytics: React.FC = () => {
  const applicationsTrend = [
    { month: 'January', applications: 45, interviews: 12 },
    { month: 'February', applications: 52, interviews: 15 },
    { month: 'March', applications: 38, interviews: 10 },
    { month: 'April', applications: 65, interviews: 18 },
  ];

  const skillDistribution = [
    { skill: 'React', candidates: 45 },
    { skill: 'Python', candidates: 38 },
    { skill: 'Node.js', candidates: 32 },
    { skill: 'TypeScript', candidates: 28 },
    { skill: 'SQL', candidates: 25 },
  ];

  const hiringFunnel = [
    { name: 'Applied', value: 200, fill: '#00D4FF' },
    { name: 'Shortlisted', value: 80, fill: '#0172B2' },
    { name: 'Interview', value: 35, fill: '#001645' },
    { name: 'Offered', value: 8, fill: '#10B981' },
  ];

  const statusDistribution = [
    { name: 'Applied', value: 120, fill: '#3b82f6' },
    { name: 'Shortlisted', value: 45, fill: '#10b981' },
    { name: 'Rejected', value: 35, fill: '#ef4444' },
  ];

  const COLORS = ['#0172B2', '#00D4FF', '#001645', '#10B981'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Applications & Interviews Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={applicationsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="applications" stroke="#0172B2" strokeWidth={2} />
              <Line type="monotone" dataKey="interviews" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Skill Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" />
              <YAxis dataKey="skill" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="candidates" fill="#0172B2" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Hiring Funnel">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hiringFunnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0172B2" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Application Status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm text-gray-600 font-semibold mb-3">Total Applicants</h3>
          <p className="text-4xl font-bold text-primary">200</p>
          <p className="text-sm text-green-600 mt-2">+12% from last month</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 font-semibold mb-3">Conversion Rate</h3>
          <p className="text-4xl font-bold text-primary">40%</p>
          <p className="text-sm text-green-600 mt-2">Applied → Shortlisted</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 font-semibold mb-3">Avg. Time to Hire</h3>
          <p className="text-4xl font-bold text-primary">28</p>
          <p className="text-sm text-gray-600 mt-2">Days</p>
        </Card>
      </div>
    </motion.div>
  );
};
