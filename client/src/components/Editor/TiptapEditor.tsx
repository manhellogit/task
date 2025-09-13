import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useSocket } from '../../contexts/SocketContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { collab, sendableSteps, getVersion } from '@tiptap/pm/collab';
import { useParams } from 'react-router-dom';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import EditorToolbar from './EditorToolbar';
import WordCounter from './WordCounter';
import { EditorConnection } from '../../services/EditorConnection';

interface TiptapEditorProps {
  documentId?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ 
  documentId: propDocumentId 
}) => {
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const { user } = useEmailAuth();
  const clientId = user?.clientId || 0;
  const [currentVersion, setCurrentVersion] = useState(0);
  const connectionRef = useRef<EditorConnection | null>(null);
  const isReceivingRef = useRef(false);
  
  const params = useParams();
  const documentId = propDocumentId || params.documentId || 'default-document';

  const [savedContent, setSavedContent] = useState<any>(null);

  // Load saved content only when we have a stable user
  useEffect(() => {
    if (user && documentId && user.email) {
      const contentKey = `cadmus-content-${documentId}-${user.email}`;
      const saved = localStorage.getItem(contentKey);
      if (saved) {
        try {
          const content = JSON.parse(saved);
          setSavedContent(content);
          console.log('📄 Loaded saved content for user:', user.email);
        } catch (error) {
          console.error('❌ Failed to parse saved content:', error);
          setSavedContent(null);
        }
      } else {
        setSavedContent(null);
      }
    }
  }, [user?.email, documentId]);

  // Content change callback
  const handleContentChange = useCallback((content: any) => {
    if (user && documentId && user.email) {
      const contentKey = `cadmus-content-${documentId}-${user.email}`;
      localStorage.setItem(contentKey, JSON.stringify(content));
      console.log('💾 Saved content for user:', user.email);
    }
  }, [user?.email, documentId]);

  // Version update callback
  const handleVersionChange = useCallback((version: number) => {
    setCurrentVersion(version);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: savedContent || '<p>Welcome to the collaborative editor! Start typing...</p>',
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      try {
        const collabPlugin = collab({ 
          version: 0, 
          clientID: clientId 
        });
        
        const newState = editor.state.reconfigure({
          plugins: [...editor.state.plugins, collabPlugin]
        });
        
        editor.view.updateState(newState);
        setCurrentVersion(0);
        
        if (socket && isConnected && user) {
          initializeConnection(editor);
        }
      } catch (error) {
        console.error('Error in editor onCreate:', error);
      }
    },
    onUpdate: ({ editor, transaction }) => {
      if (transaction.docChanged && !isReceivingRef.current && connectionRef.current) {
        
        setTimeout(() => {
          if (!isReceivingRef.current && connectionRef.current) {
            const sendable = sendableSteps(editor.state);
            if (sendable && sendable.steps.length > 0) {
              console.log(`🎯 Preparing to send ${sendable.steps.length} steps from version ${getVersion(editor.state)}`);
              connectionRef.current.send(Array.from(sendable.steps));
            }
          }
        }, 200);
        
        handleContentChange(editor.getJSON());
      }
    },
  }, [savedContent, clientId]);

  const initializeConnection = useCallback((editorInstance: any) => {
    if (!socket || connectionRef.current || !user) return;

    try {
      const connection = new EditorConnection(
        socket, 
        documentId, 
        editorInstance, 
        isReceivingRef,
        handleVersionChange,
        handleContentChange,
        clientId
      );
      connectionRef.current = connection;

      socket.on('pullUpdateResponse', (data: any) => {
        connection.handlePullResponse(data);
      });

      socket.on('pushUpdateResponse', (data: any) => {
        connection.handlePushResponse(data);
      });

      setLoading(false);
    } catch (error) {
      console.error('Error initializing connection:', error);
      setLoading(false);
    }

  }, [socket, documentId, handleVersionChange, handleContentChange, clientId, user]);

  useEffect(() => {
    if (socket && isConnected && editor && !connectionRef.current && user) {
      initializeConnection(editor);
    }

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      if (socket) {
        socket.off('pullUpdateResponse');
        socket.off('pushUpdateResponse');
      }
    };
  }, [socket, isConnected, editor, initializeConnection, user]);

  if (!isConnected) {
    return (
      <div className="p-4 text-yellow-600 bg-yellow-50 rounded-lg">
        <div className="font-medium">Connecting to collaboration server...</div>
      </div>
    );
  }

  if (loading || !editor) {
    return (
      <div className="p-4 text-blue-600 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          Initializing collaborative editor...
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container min-h-screen bg-white">
     
      
      <div className="border-b">
        <EditorToolbar editor={editor} />
      </div>

      <div className="editor-scroll-container" style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
        <div className="p-4">
          <EditorContent 
            editor={editor} 
            className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none border-none"
            style={{ maxWidth: 'none' }}
          />
        </div>
      </div>
      
      <div className="border-t">
        <WordCounter editor={editor} />
      </div>
      
      <div className="border-t px-4 py-2 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>
            Status: <span className="text-green-600">Connected</span> | 
            Version: <span className="font-semibold text-blue-600">v{currentVersion}</span> | 
            User: <span className="font-semibold text-indigo-600">{user!.email}</span> |
            Document: {documentId}
          </span>
          <span className="text-green-600 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            Collaborative editing active
          </span>
        </div>
      </div>
      
      <div className="border-t px-4 py-2 bg-green-50 text-xs text-green-600">
        <span>🎯 Real-time collaborative editing! Share this document with others using the same link.</span>
      </div>
    </div>
  );
};

export default TiptapEditor;
