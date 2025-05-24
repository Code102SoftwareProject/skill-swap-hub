import React from 'react';
import MeetingCard from './MeetingCard';
import Meeting from '@/types/meeting';

interface UpcomingMeetingListProps {
  meetings: Meeting[];
  userId: string;
  userProfiles: {[key: string]: {firstName: string, lastName: string}};
  onCancel: (meetingId: string) => void;
}

export default function UpcomingMeetingList({ 
  meetings, 
  userId, 
  userProfiles,
  onCancel
}: UpcomingMeetingListProps) {
  if (meetings.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-2 border-b pb-1 font-heading">Upcoming Meetings</h3>
      <div className="space-y-3">
        {meetings.map(meeting => (
          <MeetingCard
            key={meeting._id}
            meeting={meeting}
            userId={userId}
            userName={userProfiles[meeting.senderId === userId ? meeting.receiverId : meeting.senderId]?.firstName || 'User'}
            isUpcoming={true}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  );
}