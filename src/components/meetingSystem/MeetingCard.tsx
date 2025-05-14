import React from 'react';
import { Calendar, Clock, Check, X as XMark, Video } from 'lucide-react';
import { format } from 'date-fns';
import Meeting from '@/types/meeting';

// Props interface definition
interface MeetingCardProps {
  meeting: Meeting;
  userId: string;
  userName: string;
  isPending?: boolean;
  isUpcoming?: boolean;
  isPast?: boolean;
  isCancelled?: boolean;
  onAccept?: (meetingId: string) => void;
  onReject?: (meetingId: string) => void;
  onCancel?: (meetingId: string) => void;
}

//!Utility function Date format Time Format
export const formatDate = (date: Date | string) => {
  const dateObj = new Date(date);
  return format(dateObj, 'MMM d, yyyy');
};

export const formatTime = (date: Date | string) => {
  const dateObj = new Date(date);
  return format(dateObj, 'h:mm a');
};

// Status classes and helper functions
const STATUS_CLASSES = {
  pending: 'bg-yellow-600 text-white-800',
  accepted: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800'
};

export const getStatusClassName = (meeting: Meeting) => {
  return STATUS_CLASSES[meeting.state] || STATUS_CLASSES.default;
};

export const getStatusLabel = (meeting: Meeting, userId: string) => {
  return (meeting.state === 'pending' && meeting.senderId === userId)
    ? 'Awaiting Response'
    : meeting.state.charAt(0).toUpperCase() + meeting.state.slice(1);
};

// Component definition
const MeetingCard = ({
  meeting,
  userId,
  userName,
  isPending = false,
  isUpcoming = false,
  isPast = false,
  isCancelled = false,
  onAccept,
  onReject,
  onCancel
}: MeetingCardProps) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow">
      {/* Header section title badge */}
      <div className="flex justify-between items-start">
        {/* Meeting title */}
        <h3 className="font-semibold text-lg font-heading">
          {isPending 
            ? `Meeting Request from ${userName}` 
            : `Meeting with ${userName}`}
        </h3>
        {/* Status badge  */}
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClassName(meeting)}`}>
          {getStatusLabel(meeting, userId)}
        </span>
      </div>
      
      {/* Meeting details section */}
      <div className="mt-2 space-y-2 text-sm text-gray-600">
        {/* Date display row with calendar icon */}
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{formatDate(meeting.meetingTime)}</span>
        </div>
        
        {/* Time display row with clock icon */}
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          <span>{formatTime(meeting.meetingTime)}</span>
        </div>
        
        {/* Zoom meeting indicator*/}
        {isUpcoming && meeting.state === 'accepted' && meeting.meetingLink && (
          <div className="flex items-center text-blue-600 font-medium">
            <Video className="w-4 h-4 mr-2" />
            <span className="truncate">Zoom meeting ready</span>
          </div>
        )}
      </div>
      
      {/* Meeting description - only shows if available */}
      {meeting.description && (
        <p className="mt-2 text-gray-700 font-body">{meeting.description}</p>
      )}
      
      {/* Action buttons section - */}
      <div className="mt-4 flex justify-end space-x-2">
        {/* Accept/Decline buttons - only for pending meetings */}
        {isPending && onAccept && onReject && (
          <>
            {/* Accept button*/}
            <button 
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center font-body"
              onClick={() => onAccept(meeting._id)}
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </button>
            {/* Decline Button*/}
            <button 
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm flex items-center font-body"
              onClick={() => onReject(meeting._id)}
            >
              <XMark className="w-4 h-4 mr-1" />
              Decline
            </button>
          </>
        )}
        
        {/* Join Zoom Meeting button */}
        {(isUpcoming || isPast) && meeting.state === 'accepted' && meeting.meetingLink && (
          <a 
            href={meeting.meetingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                      text-sm flex items-center shadow-sm transition-colors"
          >
            <Video className="w-4 h-4 mr-2" />
            Join Zoom Meeting
          </a>
        )}
        
        {/* Cancel button - only for upcoming meetings created by user or accepted */}
        {isUpcoming && (meeting.senderId === userId || meeting.state === 'accepted') && onCancel && (
          <button 
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            onClick={() => onCancel(meeting._id)}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;