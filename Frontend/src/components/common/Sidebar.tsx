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

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen = true, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const userNavItems = navItems.filter(item => item.roles.includes(user.role));

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={`
        layout-sidebar
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300
        fixed lg:static left-0 top-16 lg:top-0
        w-64 h-[calc(100vh-64px)] lg:h-screen
        lg:z-auto z-50 lg:border-r
      `}
    >
      {/* Sidebar Header */}
      <div className="px-4 py-6 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Navigation</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {userNavItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg
                transition-all duration-200
                group relative
                ${isActive
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm truncate">{item.label}</span>
              {isActive && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center py-2">
          <p className="font-semibold capitalize mb-1">{user.name}</p>
          <p className="text-gray-400 capitalize">{user.role}</p>
        </div>
      </div>
    </aside>
  );
};
