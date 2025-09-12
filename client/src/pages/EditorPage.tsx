import TiptapEditor from '../components/Editor/TiptapEditor';
import { useParams } from 'react-router-dom';

const EditorPage: React.FC = () => {
  const { documentId } = useParams();

  return (
    <div className="editor-page container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Collaborative Editor {documentId && `- Document ${documentId}`}
      </h1>
      <div className="editor-wrapper border rounded-lg shadow-sm bg-white">
        {/* Remove EditorProvider - TiptapEditor handles everything */}
        <TiptapEditor documentId={documentId} />
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>Collaborate in real-time with other users. Changes are automatically saved and synchronized.</p>
      </div>
    </div>
  );
};

export default EditorPage;
