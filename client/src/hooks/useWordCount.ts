import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { calculateWordCount } from '../utils/wordCount';

interface UseWordCountOptions {
  updateDelay?: number;
}

export const useWordCount = (
  editor: Editor | null,
  options: UseWordCountOptions = {}
) => {
  const { updateDelay = 100 } = options;
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (!editor) {
      setWordCount(0);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const updateWordCount = () => {
      // Clear previous timeout
      clearTimeout(timeoutId);
      
      // Debounce the update
      timeoutId = setTimeout(() => {
        const text = editor.getText();
        const count = calculateWordCount(text);
        setWordCount(count);
      }, updateDelay);
    };

    // Initial count
    updateWordCount();

    // Listen to editor updates
    editor.on('update', updateWordCount);
    editor.on('selectionUpdate', updateWordCount);

    return () => {
      clearTimeout(timeoutId);
      editor.off('update', updateWordCount);
      editor.off('selectionUpdate', updateWordCount);
    };
  }, [editor, updateDelay]);

  return wordCount;
};