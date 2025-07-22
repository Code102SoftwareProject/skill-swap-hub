import React, { useState, useRef, useEffect } from 'react';
import { 
  StickyNote, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Save,
  Download,
  Trash2,
  RefreshCw,
  Hash,
  Clock
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import UnderlineExtension from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useMeetingNotes } from '@/hooks/useMeetingNotes';
import { generateMeetingNotesPDF, MeetingNotePDFData } from '@/utils/pdfHandler';

interface MeetingNotesSidebarProps {
  meetingId?: string;
  userId?: string;
  userName?: string;
  otherUserName?: string;
  isVisible: boolean;
  onToggle: () => void;
}

export const MeetingNotesSidebar: React.FC<MeetingNotesSidebarProps> = ({
  meetingId,
  userId,
  userName,
  otherUserName,
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
    togglePrivacy,
    saveNotes,
    deleteNotes
  } = useMeetingNotes({ meetingId, userId, userName });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [notes?.content]);

  const downloadNotes = () => {
    if (!notes?.content || !editor) return;
    
    const pdfData: MeetingNotePDFData = {
      title: notes.title || 'Untitled Notes',
      content: notes.content,
      meetingId: notes.meetingId,
      createdAt: notes.createdAt,
      lastModified: new Date().toISOString(),
      wordCount: getWordCount(),
      userName: notes.userName,
      otherUserName: otherUserName
    };
    
    generateMeetingNotesPDF(pdfData);
  };

  // Enhanced keyboard shortcuts for save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveNotes();
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

            {/* Simple Title Input */}
            <div className="flex items-center space-x-2">
              <input
                value={notes?.title || ''}
                onChange={(e) => updateTitle(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter title..."
              />
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
              </div>
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
                placeholder="Start typing your meeting notes here...

💡 Use Ctrl+S to save your notes.

Tips:
- Keep it simple and focused
- Write down key points and decisions
- Note important action items"
                className="flex-1 p-4 border-none resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm leading-relaxed"
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
