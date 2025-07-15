import React from 'react';
import { Calendar, Clock, Download, Video, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Meeting from '@/types/meeting';
import { getMeetingStatus, downloadMeetingNotesFile } from '@/services/meetingApiServices';
import OptimizedAvatar from '@/components/ui/OptimizedAvatar';

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface MeetingItemProps {
  meeting: Meeting;
  type: 'pending' | 'upcoming' | 'past' | 'cancelled';
  userId: string;
  userProfiles: { [userId: string]: UserProfile };
  meetingNotesStatus: { [meetingId: string]: boolean };
  checkingNotes: { [meetingId: string]: boolean };
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
  onMeetingAction,
  onCancelMeeting,
  onAlert
}: MeetingItemProps) {
  const router = useRouter();
  
  const otherUserId = meeting.senderId === userId ? meeting.receiverId : meeting.senderId;
  const otherUserProfile = userProfiles[otherUserId];
  const otherUserName = otherUserProfile?.firstName && otherUserProfile?.lastName 
    ? `${otherUserProfile.firstName} ${otherUserProfile.lastName}`
    : otherUserProfile?.firstName || 'User';
  
  const isPendingReceiver = type === 'pending' && meeting.receiverId === userId;
  const canCancel = type === 'upcoming' && (meeting.senderId === userId || meeting.state === 'accepted');
  
  const status = getMeetingStatus(meeting, userId);

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
    router.push(`/meeting/${meeting._id}`);
  };

  // Download notes for a meeting
  const handleDownloadNotes = async () => {
    try {
      const success = await downloadMeetingNotesFile(
        meeting._id, 
        userId, 
        `Meeting with ${otherUserName}`, 
        meeting.meetingTime.toString()
      );
      
      if (success) {
        onAlert('success', 'Notes downloaded successfully as Markdown file!');
      } else {
        onAlert('info', 'No notes found for this meeting');
      }
    } catch (error) {
      console.error('Error downloading notes:', error);
      onAlert('error', 'Failed to download notes');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200">
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
              className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onMeetingAction(meeting._id, 'reject')}
              className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium transition-colors"
            >
              Decline
            </button>
          </>
        )}

        {/* Join meeting button - only for upcoming meetings */}
        {type === 'upcoming' && meeting.state === 'accepted' && meeting.meetingLink && (
          <button
            onClick={handleJoinMeeting}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center space-x-2 transition-colors"
          >
            <Video className="w-4 h-4" />
            <span>Join Meeting</span>
          </button>
        )}

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={() => onCancelMeeting(meeting._id)}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium transition-colors"
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
