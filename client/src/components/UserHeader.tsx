// client/src/components/UserHeader.tsx
import React from 'react';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useNavigate } from 'react-router-dom';

const UserHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useEmailAuth();
  const navigate = useNavigate();

  // If not authenticated, don't render header
  if (!user || !isAuthenticated || !user.email) {
    return null;
  }

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    // Clear auth/session
    await logout();

    // Navigate to login route
    navigate('/email', { replace: true });
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 px-6 py-4 mx-2 md:mx-4 lg:mx-8 rounded-t-2xl mt-2 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left section - User info and branding */}
        <div className="flex items-center space-x-6">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Cadmus
            </span>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-gray-200"></div>

          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                <span className="text-white font-semibold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Online</span>
            </div>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
              ID: {user.userId.slice(-8)}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-red-50 group"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;
