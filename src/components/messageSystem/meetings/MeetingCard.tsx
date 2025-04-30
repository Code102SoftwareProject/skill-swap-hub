import React from 'react';
import { Calendar, Clock, Check, X as XMark } from 'lucide-react';
import { format } from 'date-fns';

interface Meeting {
  _id: string;
  senderId: string;
  receiverId: string;
  description: string;
  sentAt: Date;
  meetingTime: Date;
  meetingLink: string | null;
  acceptStatus: boolean;
  state: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
}

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

export const formatDate = (date: Date | string) => {
  const dateObj = new Date(date);
  return format(dateObj, 'MMM d, yyyy');
};

export const formatTime = (date: Date | string) => {
  const dateObj = new Date(date);
  return format(dateObj, 'h:mm a');
};

export const getStatusClassName = (meeting: Meeting) => {
  switch (meeting.state) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'accepted':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (meeting: Meeting, userId: string) => {
  if (meeting.state === 'pending' && meeting.senderId === userId) {
    return 'Awaiting Response';
  }
  return meeting.state.charAt(0).toUpperCase() + meeting.state.slice(1);
};

const MeetingCard: React.FC<MeetingCardProps> = ({
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
}) => {
  const bgClass = isPending 
    ? 'bg-yellow-50' 
    : isCancelled 
    ? 'bg-gray-50 opacity-75' 
    : isPast 
    ? 'bg-gray-50' 
    : '';

  return (
    <div className={`border rounded-lg p-4 shadow-sm hover:shadow ${bgClass}`}>
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">
          {isPending 
            ? `Meeting Request from ${userName}` 
            : `Meeting with ${userName}`}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClassName(meeting)}`}>
          {getStatusLabel(meeting, userId)}
        </span>
      </div>
      
      <div className="mt-2 space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{formatDate(meeting.meetingTime)}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          <span>{formatTime(meeting.meetingTime)}</span>
        </div>
        
        {isUpcoming && meeting.state === 'accepted' && meeting.meetingLink && (
          <div className="flex items-center text-blue-600 font-medium">
            <svg 
              className="w-4 h-4 mr-2" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16.2 8.4V7.1c0-.8-.7-1.5-1.5-1.5H5c-.8 0-1.5.7-1.5 1.5v9.1c0 .8.7 1.5 1.5 1.5h9.7c.8 0 1.5-.7 1.5-1.5v-1.3l4.7 2.7c.5.3 1.1-.1 1.1-.7V6.3c0-.6-.6-1-1.1-.7l-4.7 2.8z" />
            </svg>
            <span className="truncate">Zoom meeting ready</span>
          </div>
        )}
      </div>
      
      {meeting.description && (
        <p className="mt-2 text-gray-700">{meeting.description}</p>
      )}
      
      <div className="mt-4 flex justify-end space-x-2">
        {isPending && onAccept && onReject && (
          <>
            <button 
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center"
              onClick={() => onAccept(meeting._id)}
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </button>
            <button 
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm flex items-center"
              onClick={() => onReject(meeting._id)}
            >
              <XMark className="w-4 h-4 mr-1" />
              Decline
            </button>
          </>
        )}
        
        {(isUpcoming || isPast) && meeting.state === 'accepted' && meeting.meetingLink && (
          <a 
            href={meeting.meetingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                      text-sm flex items-center shadow-sm transition-colors"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16.2 8.4V7.1c0-.8-.7-1.5-1.5-1.5H5c-.8 0-1.5.7-1.5 1.5v9.1c0 .8.7 1.5 1.5 1.5h9.7c.8 0 1.5-.7 1.5-1.5v-1.3l4.7 2.7c.5.3 1.1-.1 1.1-.7V6.3c0-.6-.6-1-1.1-.7l-4.7 2.8z" />
            </svg>
            Join Zoom Meeting
          </a>
        )}
        
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