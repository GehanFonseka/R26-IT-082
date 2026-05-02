import React from 'react';
import { LogOut, Menu, X, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const Navbar: React.FC<{ sidebarOpen?: boolean; toggleSidebar?: () => void }> = ({
  sidebarOpen,
  toggleSidebar,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="layout-header">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X size={24} className="text-gray-600" />
              ) : (
                <Menu size={24} className="text-gray-600" />
              )}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm sm:text-base">AI</span>
            </div>
            <span className="font-bold text-base sm:text-lg text-gray-900 hidden sm:inline-block whitespace-nowrap">
              TalentAI
            </span>
          </Link>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-gray-600" />
          </button>

          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={20} className="text-gray-600" />
          </button>

          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 pl-3 sm:pl-4 border-l border-gray-200">
                <div className="text-right min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex-shrink-0" />
              </div>

              <button
                onClick={logout}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={20} className="text-gray-600 hover:text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
