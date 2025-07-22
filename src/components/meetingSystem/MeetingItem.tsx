import React from 'react';
import { Calendar, Clock, Download, Video, XCircle } from 'lucide-react';
import Meeting from '@/types/meeting';
import { getMeetingStatus, canCancelMeeting, checkMeetingNotesExist, fetchMeetingNotes } from '@/services/meetingApiServices';
import { generateMeetingNotesPDF, MeetingNotePDFData } from '@/utils/pdfHandler';
import OptimizedAvatar from '@/components/ui/OptimizedAvatar';

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface MeetingItemProps {
  meeting: Meeting;
  type: 'pending' | 'upcoming' | 'past' | 'cancelled' | 'happening';
  userId: string;
  userProfiles: { [userId: string]: UserProfile };
  meetingNotesStatus: { [meetingId: string]: boolean };
  checkingNotes: { [meetingId: string]: boolean };
  actionLoadingStates: { [meetingId: string]: string };
  onMeetingAction: (meetingId: string, action: 'accept' | 'reject' | 'cancel') => void;
  onCancelMeeting: (meetingId: string) => void;
  onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function MeetingItem({
  meeting,
  type,
  userId,
  userProfiles,
  meetingNotesStatus,
  checkingNotes,
  actionLoadingStates,
  onMeetingAction,
  onCancelMeeting,
  onAlert
}: MeetingItemProps) {
  const otherUserId = meeting.senderId === userId ? meeting.receiverId : meeting.senderId;
  const otherUserProfile = userProfiles[otherUserId];
  const otherUserName = otherUserProfile?.firstName && otherUserProfile?.lastName 
    ? `${otherUserProfile.firstName} ${otherUserProfile.lastName}`
    : otherUserProfile?.firstName || 'User';
  
  const isPendingReceiver = type === 'pending' && meeting.receiverId === userId;
  const basicCanCancel = type === 'upcoming' && (meeting.senderId === userId || meeting.state === 'accepted');
  
  // Check timing restrictions for cancellation
  const { canCancel: timingAllowsCancel, reason: cancelRestrictionReason } = canCancelMeeting(meeting);
  const canCancel = basicCanCancel && timingAllowsCancel;
  
  const status = getMeetingStatus(meeting, userId);

  // Handle cancel button click with timing validation
  const handleCancelClick = () => {
    if (!timingAllowsCancel && cancelRestrictionReason) {
      onAlert('warning', cancelRestrictionReason);
      return;
    }
    onCancelMeeting(meeting._id);
  };

  // Format date and time utilities
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle join meeting button click
  const handleJoinMeeting = () => {
    window.open(`/meeting/${meeting._id}`, '_blank');
  };

  // Download notes for a meeting
  const handleDownloadNotes = async () => {
    try {
      const notesData = await fetchMeetingNotes(meeting._id, userId);
      
      if (notesData) {
        const pdfData: MeetingNotePDFData = {
          title: notesData.title || `Meeting with ${otherUserName}`,
          content: notesData.content,
          meetingId: meeting._id,
          createdAt: notesData.createdAt,
          lastModified: notesData.lastModified,
          wordCount: notesData.wordCount,
          tags: notesData.tags,
          isPrivate: notesData.isPrivate,
          otherUserName: otherUserName,
          meetingInfo: {
            description: meeting.description,
            meetingTime: meeting.meetingTime.toString(),
            isDeleted: false
          }
        };
        
        generateMeetingNotesPDF(pdfData);
        onAlert('success', 'Notes downloaded successfully as PDF!');
      } else {
        onAlert('info', 'No notes found for this meeting');
      }
    } catch (error) {
      console.error('Error downloading notes:', error);
      onAlert('error', 'Failed to download notes');
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 transition-all duration-200 ${
      type === 'happening' 
        ? 'border-red-300 bg-red-50 shadow-lg' 
        : 'border-gray-200 hover:shadow-sm'
    }`}>
      {/* Live indicator for happening meetings */}
      {type === 'happening' && (
        <div className="flex items-center text-red-600 text-sm font-medium mb-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
          <span>🔴 Meeting in Progress</span>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <OptimizedAvatar
              userId={otherUserId}
              firstName={otherUserProfile?.firstName}
              lastName={otherUserProfile?.lastName}
              avatarUrl={otherUserProfile?.avatar}
              size="small"
              className="flex-shrink-0"
              priority={false}
              lazy={true}
            />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {type === 'pending' && isPendingReceiver 
                ? `Meeting Request from ${otherUserName}` 
                : `Meeting with ${otherUserName}`}
            </h4>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Meeting Description */}
      {meeting.description && (
        <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
      )}

      {/* Date and Time */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(meeting.meetingTime)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{formatTime(meeting.meetingTime)}</span>
        </div>
        {/* Notes indicator for past meetings */}
        {type === 'past' && (
          <>
            {checkingNotes[meeting._id] ? (
              <div className="flex items-center space-x-1 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span className="text-xs">Checking notes...</span>
              </div>
            ) : meetingNotesStatus[meeting._id] ? (
              <div className="flex items-center space-x-1 text-blue-600">
                <Download className="w-4 h-4" />
                <span className="text-xs font-medium">Notes available</span>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Meeting ready indicator for upcoming meetings */}
      {type === 'upcoming' && meeting.state === 'accepted' && meeting.meetingLink && (
        <div className="flex items-center text-blue-600 text-sm font-medium mb-3">
          <Video className="w-4 h-4 mr-2" />
          <span>Meeting ready to join</span>
        </div>
      )}

      {/* Cancellation details for cancelled meetings */}
      {type === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
          <p className="text-sm text-red-600 flex items-center">
            <XCircle className="w-4 h-4 mr-2" />
            Meeting cancelled
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2">
        {/* Pending meeting actions */}
        {isPendingReceiver && (
          <>
            <button
              onClick={() => onMeetingAction(meeting._id, 'accept')}
              disabled={!!actionLoadingStates[meeting._id]}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                actionLoadingStates[meeting._id] === 'accept'
                  ? 'bg-green-400 text-white cursor-not-allowed'
                  : actionLoadingStates[meeting._id]
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {actionLoadingStates[meeting._id] === 'accept' ? 'Accepting...' : 'Accept'}
            </button>
            <button
              onClick={() => onMeetingAction(meeting._id, 'reject')}
              disabled={!!actionLoadingStates[meeting._id]}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                actionLoadingStates[meeting._id] === 'reject'
                  ? 'bg-red-400 text-white cursor-not-allowed'
                  : actionLoadingStates[meeting._id]
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {actionLoadingStates[meeting._id] === 'reject' ? 'Declining...' : 'Decline'}
            </button>
          </>
        )}

        {/* Join meeting button - for upcoming and happening meetings */}
        {(type === 'upcoming' || type === 'happening') && meeting.state === 'accepted' && meeting.meetingLink && (
          <button
            onClick={handleJoinMeeting}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
              type === 'happening' 
                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{type === 'happening' ? '🔴 Join Now' : 'Join Meeting'}</span>
          </button>
        )}

        {/* Cancel button */}
        {basicCanCancel && (
          <button
            onClick={handleCancelClick}
            disabled={!timingAllowsCancel}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              timingAllowsCancel 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!timingAllowsCancel ? cancelRestrictionReason : 'Cancel meeting'}
          >
            Cancel
          </button>
        )}

        {/* Download notes button for past meetings - only show if notes exist */}
        {type === 'past' && meetingNotesStatus[meeting._id] && !checkingNotes[meeting._id] && (
          <button
            onClick={handleDownloadNotes}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 text-sm font-medium flex items-center space-x-1 transition-colors"
            title="Download meeting notes"
          >
            <Download className="w-4 h-4" />
            <span>Download Notes</span>
          </button>
        )}
      </div>
    </div>
  );
}
