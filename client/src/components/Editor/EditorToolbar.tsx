import React from 'react';
import type { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return (
      <div className="editor-toolbar flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-lg"></div>
          <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-lg"></div>
          <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-lg"></div>
          <span className="text-gray-400 text-sm ml-4">Loading toolbar...</span>
        </div>
      </div>
    );
  }

  const toolbarItems = [
    {
      name: 'bold',
      action: () => editor.chain().focus().toggleBold().run(),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h6a4.5 4.5 0 013.2 7.5A4.5 4.5 0 0110.5 18H4a1 1 0 01-1-1V4zm2 1v3h4.5a2.5 2.5 0 000-5H5zm0 5v6h5.5a2.5 2.5 0 000-5H5z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Bold (Ctrl+B)',
      isActive: () => editor.isActive('bold'),
    },
    {
      name: 'italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 2a1 1 0 011 1v1h2a1 1 0 110 2h-2v8h2a1 1 0 110 2H9v1a1 1 0 11-2 0v-1H5a1 1 0 110-2h2V6H5a1 1 0 010-2h2V3a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Italic (Ctrl+I)',
      isActive: () => editor.isActive('italic'),
    },
    {
      name: 'heading',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      title: 'Heading 1',
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      name: 'bulletList',
      action: () => editor.chain().focus().toggleBulletList().run(),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H4zM4 9a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H4zM4 14a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H4zM8 5a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1zM9 9a1 1 0 100 2h6a1 1 0 100-2H9zM8 15a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Bullet List',
      isActive: () => editor.isActive('bulletList'),
    },
  ];

  return (
    <div className="editor-toolbar bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          {toolbarItems.map((item, index) => (
            <React.Fragment key={item.name}>
              <button
                onClick={item.action}
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${
                  item.isActive() 
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={item.title}
              >
                <div className={`transition-transform duration-200 ${item.isActive() ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </div>
              </button>
              {index < toolbarItems.length - 1 && (
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="hidden md:flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-save enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
