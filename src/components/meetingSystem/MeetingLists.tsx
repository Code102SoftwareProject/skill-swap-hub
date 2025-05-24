import React, { useState } from 'react';
import MeetingCard from './MeetingCard';
import Meeting from '@/types/meeting';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MeetingListsProps {
  type: 'past' | 'cancelled';
  meetings: Meeting[];
  userId: string;
  userProfiles: {[key: string]: {firstName: string, lastName: string}};
  cancellationInfo?: {[meetingId: string]: {
    _id: string;
    reason: string;
    cancelledAt: string;
    acknowledged: boolean;
    acknowledgedAt: string | null;
    cancelledBy: string;
  }};
  onAcknowledgeCancellation?: (cancellationId: string) => void;
}

export default function MeetingLists({
  type, 
  meetings, 
  userId, 
  userProfiles,
  cancellationInfo,
  onAcknowledgeCancellation
}: MeetingListsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (meetings.length === 0) return null;

  const title = type === 'past' ? 'Past Meetings' : 'Cancelled Meetings';
  const isPast = type === 'past';
  const isCancelled = type === 'cancelled';

  return (
    <div className="border rounded-md p-2">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center font-semibold text-lg pb-1 font-heading"
      >
        <span>{title} ({meetings.length})</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isExpanded && (
        <div className="space-y-3 mt-2">
          {meetings.map(meeting => (
            <MeetingCard
              key={meeting._id}
              meeting={meeting}
              userId={userId}
              userName={userProfiles[meeting.senderId === userId ? meeting.receiverId : meeting.senderId]?.firstName || 'User'}
              isPast={isPast}
              isCancelled={isCancelled}
              cancellationInfo={isCancelled ? cancellationInfo?.[meeting._id] : undefined}
              onAcknowledgeCancellation={isCancelled ? onAcknowledgeCancellation : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}