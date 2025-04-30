import React from 'react';
import MeetingCard from './MeetingCard';
import Meeting from '@/types/meeting';
interface PendingMeetingListProps {
  meetings: Meeting[];
  userId: string;
  userProfiles: {[key: string]: {firstName: string, lastName: string}};
  onAccept: (meetingId: string) => void;
  onReject: (meetingId: string) => void;
}

const PendingMeetingList: React.FC<PendingMeetingListProps> = ({ 
  meetings, 
  userId, 
  userProfiles,
  onAccept,
  onReject
}) => {
  if (meetings.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-2 border-b pb-1">Meeting Requests</h3>
      <div className="space-y-3">
        {meetings.map(meeting => (
          <MeetingCard
            key={meeting._id}
            meeting={meeting}
            userId={userId}
            userName={userProfiles[meeting.senderId]?.firstName || 'User'}
            isPending={true}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
};

export default PendingMeetingList;