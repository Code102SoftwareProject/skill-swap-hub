import React from 'react';
import MeetingCard from './MeetingCard';

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

interface MeetingListsProps {
  type: 'past' | 'cancelled';
  meetings: Meeting[];
  userId: string;
  userProfiles: {[key: string]: {firstName: string, lastName: string}};
}

const MeetingLists: React.FC<MeetingListsProps> = ({ 
  type, 
  meetings, 
  userId, 
  userProfiles
}) => {
  if (meetings.length === 0) return null;

  const getUserName = (userId: string) => {
    const profile = userProfiles[userId];
    return profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...';
  };

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
            userName={getUserName(meeting.senderId === userId ? meeting.receiverId : meeting.senderId)}
            isPast={isPast}
            isCancelled={isCancelled}
          />
        ))}
      </div>
    </div>
  );
};

export default MeetingLists;