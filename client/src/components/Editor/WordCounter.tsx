import { useWordCount } from '../../hooks/useWordCount';
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface WordCounterProps {
  editor: Editor | null;
}

const WordCounter: React.FC<WordCounterProps> = ({ editor }) => {
  const wordCount = useWordCount(editor);
  const [characterCount, setCharacterCount] = useState(0);

  // Update character count separately
  useEffect(() => {
    if (!editor) {
      setCharacterCount(0);
      return;
    }

    const updateCharacterCount = () => {
      const text = editor.getText();
      setCharacterCount(text.length);
    };

    // Initial count
    updateCharacterCount();

    // Listen to editor updates
    const handleUpdate = () => updateCharacterCount();
    
    editor.on('update', handleUpdate);
    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);

  return (
    <div className="word-counter text-sm text-gray-600 bg-gray-50 p-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="font-medium">
          Words: <span className="text-blue-600 font-semibold">{wordCount}</span>
        </span>
        <span className="text-gray-400">|</span>
        <span>
          Characters: <span className="font-semibold">{characterCount}</span>
        </span>
      </div>
      
      <div className="text-xs text-gray-400">
        {wordCount === 0 
          ? "Start typing to see word count" 
          : `${wordCount} word${wordCount !== 1 ? 's' : ''}`
        }
      </div>
    </div>
  );
};

export default WordCounter;
