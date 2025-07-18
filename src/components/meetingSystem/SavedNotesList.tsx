import React from 'react';
import { FileText, Calendar, Clock, Tag, Eye, Download } from 'lucide-react';

interface MeetingNote {
  _id: string;
  meetingId: string;
  title: string;
  content: string;
  tags: string[];
  wordCount: number;
  lastModified: string;
  createdAt: string;
  isPrivate: boolean;
  meetingInfo?: {
    description: string;
    meetingTime: string;
    senderId: string;
    receiverId: string;
    isDeleted?: boolean;
  };
}

interface SavedNotesListProps {
  notes: MeetingNote[];
  loading: boolean;
  onViewNotes: (note: MeetingNote) => void;
  onDownloadNotes: (note: MeetingNote) => void;
}

export default function SavedNotesList({
  notes,
  loading,
  onViewNotes,
  onDownloadNotes
}: SavedNotesListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 text-xs mt-2">Loading saved notes...</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No saved meeting notes found</p>
        <p className="text-gray-400 text-xs mt-1">
          Notes will appear here after you save them from past meetings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div
          key={note._id}
          className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
        >
          {/* Note Header */}
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
              {note.title}
            </h4>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onViewNotes(note)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="View notes"
              >
                <Eye className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDownloadNotes(note)}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="Download notes"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Meeting Info */}
          {note.meetingInfo && (
            <div className="text-xs text-gray-600 mb-2">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                <span className={note.meetingInfo.isDeleted ? 'text-red-600 italic' : ''}>
                  Meeting: {note.meetingInfo.description}
                  {note.meetingInfo.isDeleted && ' (Removed)'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(note.meetingInfo.meetingTime)}</span>
              </div>
            </div>
          )}

          {/* Note Summary - No content preview */}
          <p className="text-xs text-gray-600 mb-2">
            Meeting notes saved - Click to view or download
          </p>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Tag className="w-3 h-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{note.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>{note.wordCount} words</span>
              {note.isPrivate && (
                <span className="text-amber-600">Private</span>
              )}
            </div>
            <span>Modified {formatDate(note.lastModified)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
