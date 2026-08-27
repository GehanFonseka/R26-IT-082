import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Calendar,
  BarChart3,
  Users,
  Settings,
  AlertCircle,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  // Candidate
  {
    label: 'Dashboard',
    path: '/candidate/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['candidate'],
  },
  { label: 'Jobs', path: '/candidate/jobs', icon: <Briefcase size={20} />, roles: ['candidate'] },
  {
    label: 'Applications',
    path: '/candidate/applications',
    icon: <FileText size={20} />,
    roles: ['candidate'],
  },
  { label: 'Profile', path: '/candidate/profile', icon: <User size={20} />, roles: ['candidate'] },
  {
    label: 'Interviews',
    path: '/candidate/interviews',
    icon: <Calendar size={20} />,
    roles: ['candidate'],
  },

  // Recruiter
  {
    label: 'Dashboard',
    path: '/recruiter/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['recruiter'],
  },
  { label: 'Vacancies', path: '/recruiter/vacancies', icon: <Briefcase size={20} />, roles: ['recruiter'] },
  { label: 'Candidates', path: '/recruiter/candidates', icon: <Users size={20} />, roles: ['recruiter'] },
  {
    label: 'Interviews',
    path: '/recruiter/interviews',
    icon: <Calendar size={20} />,
    roles: ['recruiter'],
  },
  {
    label: 'Analytics',
    path: '/recruiter/analytics',
    icon: <BarChart3 size={20} />,
    roles: ['recruiter'],
  },

  // Admin
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['admin'],
  },
  { label: 'Users', path: '/admin/users', icon: <Users size={20} />, roles: ['admin'] },
  { label: 'System Logs', path: '/admin/logs', icon: <AlertCircle size={20} />, roles: ['admin'] },
  { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} />, roles: ['admin'] },
];

export const Sidebar: React.FC<{ isOpen?: boolean }> = ({ isOpen = true }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const userNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside
      className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 fixed lg:static left-0 top-16 lg:top-0 w-64 h-[calc(100vh-64px)] lg:h-screen bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 overflow-y-auto z-30`}
    >
      <div className="p-6">
        <nav className="space-y-2">
          {userNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
