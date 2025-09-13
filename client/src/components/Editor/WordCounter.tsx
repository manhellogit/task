import { useWordCount } from '../../hooks/useWordCount';
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface WordCounterProps {
  editor: Editor | null;
}

const WordCounter: React.FC<WordCounterProps> = ({ editor }) => {
  const wordCount = useWordCount(editor);
  const [characterCount, setCharacterCount] = useState(0);

  // Update character count separately (keep existing logic)
  useEffect(() => {
    if (!editor) {
      setCharacterCount(0);
      return;
    }

    const updateCharacterCount = () => {
      const text = editor.getText();
      setCharacterCount(text.length);
    };

    updateCharacterCount();
    const handleUpdate = () => updateCharacterCount();
    
    editor.on('update', handleUpdate);
    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);

  return (
    <div className="word-counter bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-t border-gray-100">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Stats */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Words: <span className="text-blue-600 font-bold">{wordCount.toLocaleString()}</span>
            </span>
          </div>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
            </svg>
            <span className="text-sm text-gray-700">
              Characters: <span className="font-semibold text-purple-600">{characterCount.toLocaleString()}</span>
            </span>
          </div>
        </div>
        
        {/* Status message */}
        <div className="hidden md:block">
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full">
            {wordCount === 0 ? (
              <>
                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-blue-700 font-medium">Start typing to see word count</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-blue-700 font-medium">
                  {wordCount} word{wordCount !== 1 ? 's' : ''} written
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCounter;
