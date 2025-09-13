// client/src/pages/EditorPage.tsx
import React from 'react';
import TiptapEditor from '../components/Editor/TiptapEditor';
import EmailLogin from '../components/EmailLogin';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useParams } from 'react-router-dom';
import UserHeader from '../components/UserHeader';

const EditorPage: React.FC = () => {
  const { documentId } = useParams();
  const { isAuthenticated, loading, user } = useEmailAuth();

  console.log('🏠 EditorPage render:', { isAuthenticated, loading, hasUser: !!user });

  // Enhanced loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-800 mb-1">Loading Cadmus</p>
            <p className="text-sm text-gray-600">Preparing your collaborative workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // FIXED: More thorough authentication check
  if (!isAuthenticated || !user || !user.email) {
    console.log('🔒 Not authenticated, showing login');
    return <EmailLogin />;
  }

  // FIXED: Only show editor if fully authenticated
  console.log('✅ Authenticated, showing editor for:', user.email);
  return (
    <div className="editor-page min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <UserHeader />
      <div className="editor-wrapper bg-white/95 backdrop-blur-sm min-h-screen shadow-2xl border border-white/20 mx-2 md:mx-4 lg:mx-8 rounded-t-2xl mt-2 animate-slide-in">
        <TiptapEditor documentId={documentId} />
      </div>
    </div>
  );
};

export default EditorPage;
