import React from 'react';
import { X, Calendar, Clock, Tag, Download, FileText } from 'lucide-react';

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

interface NotesViewModalProps {
  note: MeetingNote;
  onClose: () => void;
  onDownload: (note: MeetingNote) => void;
}

export default function NotesViewModal({
  note,
  onClose,
  onDownload
}: NotesViewModalProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date not available';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2">
        {line || '\u00A0'} {/* Non-breaking space for empty lines */}
      </p>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {note.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(note)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Download notes"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Meeting Info */}
          {note.meetingInfo && note.meetingInfo.meetingTime && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Meeting Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(note.meetingInfo.meetingTime)}</span>
                </div>
                {note.meetingInfo.isDeleted && (
                  <div className="text-xs text-red-600 italic mt-1">
                    * This meeting has been removed from the system but your notes are preserved.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes Content */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Notes Content</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto">
              {note.content ? (
                <div dangerouslySetInnerHTML={{ __html: note.content.replace(/\n/g, '<br>') }} />
              ) : (
                <p className="text-gray-500 italic">No content available</p>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>{note.wordCount} words</span>
                {note.isPrivate && (
                  <span className="text-amber-600 font-medium">Private Notes</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span>Created: {formatDate(note.createdAt)}</span>
                <span>Modified: {formatDate(note.lastModified)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onDownload(note)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
