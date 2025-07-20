import React, { useState, useRef, useEffect } from 'react';
import { 
  StickyNote, 
  Save, 
  Edit3, 
  Tag, 
  Eye, 
  EyeOff, 
  X, 
  Plus, 
  Clock, 
  Hash,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Type,
  List,
  Quote
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import UnderlineExtension from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useMeetingNotes } from '@/hooks/useMeetingNotes';
import '@/styles/tiptap.css';

interface MeetingNotesSidebarProps {
  meetingId?: string;
  userId?: string;
  userName?: string;
  isVisible: boolean;
  onToggle: () => void;
}

export const MeetingNotesSidebar: React.FC<MeetingNotesSidebarProps> = ({
  meetingId,
  userId,
  userName,
  isVisible,
  onToggle
}) => {
  const {
    notes,
    isLoading,
    isSaving,
    error,
    lastSaved,
    hasUnsavedChanges,
    updateContent,
    updateTitle,
    addTag,
    removeTag,
    togglePrivacy,
    saveNotes,
    deleteNotes
  } = useMeetingNotes({ meetingId, userId, userName });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Tiptap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded',
        },
      }),
      UnderlineExtension,
      Placeholder.configure({
        placeholder: `Start typing your meeting notes here...

💡 Keyboard shortcuts:
• Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
• Ctrl+H for highlight, Ctrl+Q for quotes, Ctrl+L for bullet points
• Ctrl+S to save, Add topics using the input above

Tips:
- Use **bold** for emphasis
- Use *italic* for highlights  
- Use ==highlight== for important points
- Use ## Topic for headings (or use topic input)
- Use - for bullet points
- Use > for quotes`,
      }),
    ],
    content: notes?.content || '',
    onUpdate: ({ editor }) => {
      updateContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'flex-1 p-4 border-none resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert',
      },
    },
  });

  // Update editor content when notes change
  useEffect(() => {
    if (editor && notes?.content !== editor.getHTML()) {
      editor.commands.setContent(notes?.content || '');
    }
  }, [notes?.content, editor]);

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const downloadNotes = () => {
    if (!notes?.content || !editor) return;
    
    // Create a well-formatted markdown document
    const formattedDate = new Date(notes.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = new Date(notes.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Convert HTML to markdown-like format for download
    const htmlContent = editor.getHTML();
    let formattedContent = htmlContent
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1')
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1')
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
      .replace(/<u[^>]*>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/<mark[^>]*>(.*?)<\/mark>/g, '==$1==')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '> $1')
      .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/\n\s*\n/g, '\n\n') // Clean up extra whitespace
      .trim();

    const wordCount = getWordCount();
    
    const markdownDocument = `# Meeting Notes

---

## Meeting Information

- **Meeting:** ${notes.title || 'Untitled Notes'}
- **Date:** ${formattedDate}
- **Time:** ${formattedTime}
- **Meeting ID:** \`${notes.meetingId}\`
- **Author:** ${notes.userName || 'Unknown'}

---

## Content

${formattedContent}

---

## Meeting Details

- **Word Count:** ${wordCount}
- **Tags:** ${notes.tags?.join(', ') || 'None'}
- **Created:** ${new Date(notes.createdAt).toLocaleDateString()}
- **Last Updated:** ${new Date().toLocaleDateString()}

---

*Generated by SkillSwap Hub - Meeting Notes System*
    `;
    
    const blob = new Blob([markdownDocument], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-notes-${notes.meetingId}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Rich text editing functions for Tiptap
  const formatBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const formatItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const formatUnderline = () => {
    editor?.chain().focus().toggleUnderline().run();
  };

  const formatHighlight = () => {
    editor?.chain().focus().toggleHighlight().run();
  };

  const insertTopic = () => {
    if (currentTopic.trim() && editor) {
      editor.chain().focus().setHeading({ level: 2 }).insertContent(currentTopic.trim()).insertContent('<p></p>').run();
      setCurrentTopic('');
    }
  };

  const insertBulletPoint = () => {
    editor?.chain().focus().toggleBulletList().run();
  };

  const insertQuote = () => {
    editor?.chain().focus().toggleBlockquote().run();
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      insertTopic();
    }
  };

  // Enhanced keyboard shortcuts for Tiptap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatBold();
          break;
        case 'i':
          e.preventDefault();
          formatItalic();
          break;
        case 'u':
          e.preventDefault();
          formatUnderline();
          break;
        case 'h':
          e.preventDefault();
          formatHighlight();
          break;
        case 'q':
          e.preventDefault();
          insertQuote();
          break;
        case 'l':
          e.preventDefault();
          insertBulletPoint();
          break;
        case 's':
          e.preventDefault();
          saveNotes();
          break;
      }
    }
  };

  const getWordCount = () => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!meetingId || !userId) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 z-50 transform -translate-y-1/2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-l-md transition-all duration-300 ${
          isVisible ? 'right-96' : 'right-0'
        }`}
        title={isVisible ? 'Close Notes' : 'Open Notes'}
      >
        <div className="flex items-center px-2 py-3">
          {isVisible ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <StickyNote size={14} className="ml-1" />
        </div>
      </button>

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg transform transition-transform duration-300 z-40 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <StickyNote size={18} className="text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Notes</span>
              </div>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title Section */}
            <div className="flex items-center space-x-2">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  value={notes?.title || ''}
                  onChange={(e) => updateTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter title..."
                />
              ) : (
                <h3 
                  className="flex-1 text-sm font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 text-gray-900 dark:text-gray-100"
                  onClick={() => setIsEditingTitle(true)}
                  title="Click to edit title"
                >
                  {notes?.title || 'Untitled Notes'}
                </h3>
              )}
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                title="Edit title"
              >
                <Edit3 size={12} />
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <Hash size={10} />
                  <span>{getWordCount()} words</span>
                </span>
                {lastSaved && (
                  <span className="flex items-center space-x-1">
                    <Clock size={10} />
                    <span>Saved {formatTime(lastSaved)}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {isSaving && (
                  <RefreshCw size={10} className="animate-spin text-blue-500" />
                )}
                {hasUnsavedChanges && (
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" title="Unsaved changes" />
                )}
                <button
                  onClick={togglePrivacy}
                  className={`p-1 rounded ${notes?.isPrivate ? 'text-gray-500' : 'text-blue-500'}`}
                  title={notes?.isPrivate ? 'Private notes' : 'Shared notes'}
                >
                  {notes?.isPrivate ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Tags</label>
              <button
                onClick={() => setShowTagInput(true)}
                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                title="Add tag"
              >
                <Plus size={12} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {notes?.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-md"
                >
                  <Tag size={8} className="mr-1" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-600"
                    title="Remove tag"
                  >
                    <X size={8} />
                  </button>
                </span>
              ))}
            </div>

            {showTagInput && (
              <div className="flex items-center space-x-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tag..."
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
                  autoFocus
                />
                <button
                  onClick={handleAddTag}
                  className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded"
                >
                  <Plus size={10} />
                </button>
                <button
                  onClick={() => { setNewTag(''); setShowTagInput(false); }}
                  className="text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Enhanced Rich Text Toolbar */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Formatting</span>
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Text Formatting */}
                <button
                  onClick={formatBold}
                  className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ${
                    editor?.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold size={12} />
                </button>
                <button
                  onClick={formatItalic}
                  className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ${
                    editor?.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic size={12} />
                </button>
                <button
                  onClick={formatUnderline}
                  className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ${
                    editor?.isActive('underline') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  <Underline size={12} />
                </button>
                <button
                  onClick={formatHighlight}
                  className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ${
                    editor?.isActive('highlight') ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : ''
                  }`}
                  title="Highlight (Ctrl+H)"
                >
                  <Highlighter size={12} />
                </button>

                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                {/* Lists and Structure */}
                <button
                  onClick={insertBulletPoint}
                  className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ${
                    editor?.isActive('bulletList') ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : ''
                  }`}
                  title="Bullet List (Ctrl+L)"
                >
                  <List size={12} />
                </button>
                <button
                  onClick={insertQuote}
                  className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ${
                    editor?.isActive('blockquote') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''
                  }`}
                  title="Quote (Ctrl+Q)"
                >
                  <Quote size={12} />
                </button>
              </div>
            </div>
            
            {/* Topic Input */}
            <div className="flex items-center space-x-2">
              <Type size={12} className="text-gray-500 dark:text-gray-400" />
              <input
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyDown={handleTopicKeyDown}
                placeholder="Add topic/heading..."
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
              />
              <button
                onClick={insertTopic}
                disabled={!currentTopic.trim()}
                className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:text-gray-400 p-1 rounded"
                title="Insert Topic"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw size={20} className="animate-spin text-secondary" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <div 
                className="flex-1 overflow-y-auto"
                onKeyDown={handleKeyDown}
                style={{ minHeight: '200px' }}
              >
                <EditorContent 
                  editor={editor}
                  className="h-full"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border p-4 bg-secondary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={saveNotes}
                  disabled={isSaving}
                  className="flex items-center space-x-1 bg-secondary hover:bg-secondary/80 disabled:bg-secondary/60 text-secondary-foreground px-3 py-1.5 rounded text-sm transition-colors"
                >
                  {isSaving ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
                
                <button
                  onClick={downloadNotes}
                  disabled={!notes?.content}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-foreground hover:bg-secondary/20 disabled:text-muted-foreground/50 px-3 py-1.5 rounded text-sm transition-colors"
                  title="Download notes"
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>
              </div>
              
              <button
                onClick={deleteNotes}
                className="flex items-center space-x-1 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded text-sm transition-colors"
                title="Delete notes"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/10 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};
