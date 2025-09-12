import React from 'react';
import type { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return (
      <div className="editor-toolbar flex flex-wrap gap-1 p-2 border-b bg-gray-50 rounded-t-lg">
        <div className="text-gray-400 text-sm">Toolbar loading...</div>
      </div>
    );
  }

  const toolbarItems = [
    {
      name: 'bold',
      action: () => editor.chain().focus().toggleBold().run(),
      icon: 'B',
      title: 'Bold',
      isActive: () => editor.isActive('bold'),
    },
    {
      name: 'italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      icon: 'I',
      title: 'Italic',
      isActive: () => editor.isActive('italic'),
    },
    {
      name: 'heading',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: 'H1',
      title: 'Heading 1',
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      name: 'bulletList',
      action: () => editor.chain().focus().toggleBulletList().run(),
      icon: '•',
      title: 'Bullet List',
      isActive: () => editor.isActive('bulletList'),
    },
  ];

  return (
    <div className="editor-toolbar flex flex-wrap gap-1 p-2 bg-gray-50 rounded-t-lg">
      {toolbarItems.map((item) => (
        <button
          key={item.name}
          onClick={item.action}
          className={`p-2 rounded min-w-[40px] text-sm font-medium transition-colors ${
            item.isActive() 
              ? 'bg-blue-100 text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={item.title}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
};

export default EditorToolbar;
