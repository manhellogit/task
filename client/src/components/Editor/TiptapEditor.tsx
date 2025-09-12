import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useSocket } from '../../contexts/SocketContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { collab, sendableSteps, receiveTransaction, getVersion } from '@tiptap/pm/collab';
import { useParams } from 'react-router-dom';
import { Step } from '@tiptap/pm/transform';
import EditorToolbar from './EditorToolbar';
import WordCounter from './WordCounter';

interface TiptapEditorProps {
  documentId?: string;
}

// Connection states
type CommState = 'start' | 'poll' | 'send' | 'recover';

class EditorConnection {
  private socket: any;
  private docId: string;
  private clientID: number;
  private state: CommState;
  private backOff: number;
  private editor: any;
  private isReceiving: boolean = false;
  private isReceivingRef: React.MutableRefObject<boolean>;
  private onVersionChange: (version: number) => void; // Add this callback

  constructor(
    socket: any, 
    docId: string, 
    editor: any, 
    isReceivingRef: React.MutableRefObject<boolean>,
    onVersionChange: (version: number) => void // Add parameter
  ) {
    this.socket = socket;
    this.docId = docId;
    this.clientID = Math.floor(Math.random() * 0xFFFFFFFF);
    this.state = 'start';
    this.backOff = 0;
    this.editor = editor;
    this.isReceivingRef = isReceivingRef;
    this.onVersionChange = onVersionChange; // Store callback
    this.start();
  }

  start() {
    console.log('🔧 Starting collaboration connection...');
    this.state = 'poll';
    this.poll();
  }

  poll() {
    if (this.state !== 'poll' || !this.editor) return;
    
    const version = getVersion(this.editor.state);
    console.log(`🔄 Polling for updates from version ${version}`);
    
    this.socket.emit('pullUpdates', {
      docId: this.docId,
      version: version
    });
  }

  send(steps: any[]) {
    if (!this.editor) return;
    
    this.state = 'send';
    const version = getVersion(this.editor.state);
    
    console.log(`📤 Sending ${steps.length} steps from version ${version}`);
    
    this.socket.emit('pushUpdates', {
      docId: this.docId,
      version: version,
      steps: steps.map(s => s.toJSON()),
      clientID: this.clientID
    });

    // Update version display after sending
    this.updateVersionDisplay();
  }

  handlePullResponse(data: any) {
    if (data.error) {
      console.error('❌ Pull error:', data.error);
      this.recover();
      return;
    }

    if (data.steps && data.steps.length > 0 && this.editor && !this.isReceiving) {
      console.log(`📥 Received ${data.steps.length} steps`);
      
      // Set both flags to prevent recursive sending
      this.isReceiving = true;
      this.isReceivingRef.current = true;
      
      try {
        const steps = data.steps.map((stepJSON: any) => 
          Step.fromJSON(this.editor.schema, stepJSON)
        );
        
        const clientIDs = data.steps.map((step: any) => step.clientID || 0);
        
        // Use receiveTransaction to apply steps
        const tr = receiveTransaction(this.editor.state, steps, clientIDs);
        
        // Apply transaction using TipTap's dispatch method
        this.editor.view.dispatch(tr);
        
        const newVersion = getVersion(this.editor.state);
        console.log(`✅ Applied ${steps.length} steps, version now: ${newVersion}`);
        
        // Update version display after receiving
        this.updateVersionDisplay();
        
      } catch (error) {
        console.error('❌ Error applying steps:', error);
      }
      
      // Reset flags after a short delay
      setTimeout(() => {
        this.isReceiving = false;
        this.isReceivingRef.current = false;
      }, 10);
    }

    // Continue polling with reduced frequency
    if (this.state === 'poll' || this.state === 'send') {
      this.state = 'poll';
      setTimeout(() => this.poll(), 1000);
    }
  }

  handlePushResponse(data: any) {
    if (data.error) {
      console.error('❌ Push error:', data.error);
      this.state = 'poll';
      this.poll();
      return;
    }

    console.log(`✅ Steps confirmed at version ${data.version}`);
    this.state = 'poll';
    this.poll();
  }

  // Helper method to update version in UI
  private updateVersionDisplay() {
    if (this.editor) {
      const currentVersion = getVersion(this.editor.state);
      this.onVersionChange(currentVersion);
    }
  }

  recover() {
    console.log('🔄 Recovering connection...');
    this.state = 'recover';
    this.backOff = Math.min((this.backOff || 200) * 2, 6000);
    
    setTimeout(() => {
      if (this.state === 'recover') {
        this.state = 'poll';
        this.poll();
      }
    }, this.backOff);
  }

  close() {
    // Cleanup
  }
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ 
  documentId: propDocumentId 
}) => {
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [clientId] = useState(() => Math.floor(Math.random() * 0xFFFFFFFF));
  const [currentVersion, setCurrentVersion] = useState(0); // Direct version state
  const connectionRef = useRef<EditorConnection | null>(null);
  const isReceivingRef = useRef(false);
  
  const params = useParams();
  const documentId = propDocumentId || params.documentId || 'default-document';

  // Version update callback
  const handleVersionChange = useCallback((version: number) => {
    setCurrentVersion(version);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '<p>Welcome to the collaborative editor! Start typing...</p>',
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      try {
        // Add collaboration plugin
        const collabPlugin = collab({ 
          version: 0, 
          clientID: clientId 
        });
        
        const newState = editor.state.reconfigure({
          plugins: [...editor.state.plugins, collabPlugin]
        });
        
        editor.view.updateState(newState);
        
        // Set initial version
        setCurrentVersion(0);
        
        // Initialize connection
        if (socket && isConnected) {
          initializeConnection(editor);
        }
      } catch (error) {
        console.error('Error in editor onCreate:', error);
      }
    },
    onUpdate: ({ editor, transaction }) => {
      // Only send steps for user changes, not received steps
      if (transaction.docChanged && !isReceivingRef.current && connectionRef.current) {
        const sendable = sendableSteps(editor.state);
        if (sendable && sendable.steps.length > 0) {
          connectionRef.current.send(Array.from(sendable.steps));
        }
      }
    },
  });

  const initializeConnection = useCallback((editorInstance: any) => {
    if (!socket || connectionRef.current) return;

    try {
      const connection = new EditorConnection(
        socket, 
        documentId, 
        editorInstance, 
        isReceivingRef,
        handleVersionChange // Pass the version callback
      );
      connectionRef.current = connection;

      // Set up socket listeners
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

  }, [socket, documentId, handleVersionChange]);

  useEffect(() => {
    if (socket && isConnected && editor && !connectionRef.current) {
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
  }, [socket, isConnected, editor, initializeConnection]);

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
    <div className="editor-container min-h-[500px] bg-white">
      <div className="border-b">
        <EditorToolbar editor={editor} />
      </div>

      <div className="p-4">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] border-none"
        />
      </div>
      
      <div className="border-t">
        <WordCounter editor={editor} />
      </div>
      
      <div className="border-t px-4 py-2 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>
            Status: <span className="text-green-600">Connected</span> | 
            Version: <span className="font-semibold text-blue-600">v{currentVersion}</span> | 
            Client: {clientId.toString(16).slice(-6)} |
            Document: {documentId}
          </span>
          <span className="text-green-600 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            Collaborative editing active
          </span>
        </div>
      </div>
      
      <div className="border-t px-4 py-2 bg-green-50 text-xs text-green-600">
        <span>🎯 Real-time collaborative editing! Open another tab to test collaboration.</span>
      </div>
    </div>
  );
};

export default TiptapEditor;
