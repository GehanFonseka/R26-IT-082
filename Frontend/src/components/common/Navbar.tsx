import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const Navbar: React.FC<{ sidebarOpen?: boolean; toggleSidebar?: () => void }> = ({
  sidebarOpen,
  toggleSidebar,
}) => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {toggleSidebar && (
            <button onClick={toggleSidebar} className="lg:hidden">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="font-bold text-xl text-gray-800 hidden sm:block">TalentAI</span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {user && (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} className="text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
