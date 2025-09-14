// client/src/pages/EditorPage.tsx
import React, { useEffect } from 'react';
import TiptapEditor from '../components/Editor/TiptapEditor';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useParams, useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';

const EditorPage: React.FC = () => {
  const { documentId } = useParams();
  const { isAuthenticated, loading, user } = useEmailAuth();
  const navigate = useNavigate();

  // If not authenticated, send to /email
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.email)) {
      navigate('/email', { replace: true });
    }
  }, [loading, isAuthenticated, user?.email, navigate]);

  // Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center ">
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

  // If unauthenticated, we return null briefly since navigate will push to /email
  if (!isAuthenticated || !user?.email) {
    return null;
  }

  // Authenticated → show editor
  return (
    <div className="editor-page border rounded-2xl">
      <UserHeader />
      <div className="editor-wrapper bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20 mx-2 md:mx-4 lg:mx-8 rounded-t-2xl mt-2 animate-slide-in">
        <TiptapEditor documentId={documentId} />
      </div>
    </div>
  );
};

export default EditorPage;
