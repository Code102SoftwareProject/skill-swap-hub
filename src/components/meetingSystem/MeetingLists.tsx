import React from 'react';
import MeetingCard from './MeetingCard';
import Meeting  from '@/types/meeting';

interface MeetingListsProps {
  type: 'past' | 'cancelled';
  meetings: Meeting[];
  userId: string;
  userProfiles: {[key: string]: {firstName: string, lastName: string}};
}

export default function MeetingLists({
  type, 
  meetings, 
  userId, 
  userProfiles
}: MeetingListsProps) {
  if (meetings.length === 0) return null;

  const title = type === 'past' ? 'Past Meetings' : 'Cancelled Meetings';
  const isPast = type === 'past';
  const isCancelled = type === 'cancelled';

  return (
    <div>
      <h3 className="font-semibold text-lg mb-2 border-b pb-1">{title}</h3>
      <div className="space-y-3">
        {meetings.map(meeting => (
          <MeetingCard
            key={meeting._id}
            meeting={meeting}
            userId={userId}
            userName={userProfiles[meeting.senderId === userId ? meeting.receiverId : meeting.senderId]?.firstName || 'User'}
            isPast={isPast}
            isCancelled={isCancelled}
          />
        ))}
      </div>
    </div>
  );
}