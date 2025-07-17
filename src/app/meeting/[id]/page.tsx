'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DailyMeeting from '@/components/meetingSystem/DailyMeeting';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface Meeting {
  _id: string;
  senderId: string;
  receiverId: string;
  description: string;
  meetingTime: string;
  meetingLink: string | null;
  acceptStatus: boolean;
  state: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch meeting details and user information
  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Wait for auth to be ready
        if (authLoading || !user) {
          return;
        }

        // Fetch meeting details
        const meetingResponse = await fetch(`/api/meeting/${meetingId}`, {
          credentials: 'include',
        });

        if (!meetingResponse.ok) {
          throw new Error('Failed to fetch meeting data');
        }

        const meetingData = await meetingResponse.json();
        setMeeting(meetingData);

        // Determine the other user (sender or receiver)
        const otherUserId = meetingData.senderId === user._id 
          ? meetingData.receiverId 
          : meetingData.senderId;

        // Fetch other user's profile
        const otherUserResponse = await fetch(`/api/users/profile?id=${otherUserId}`, {
          credentials: 'include',
        });

        if (otherUserResponse.ok) {
          const otherUserData = await otherUserResponse.json();
          setOtherUser(otherUserData.user);
        }

      } catch (err) {
        console.error('Error fetching meeting data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load meeting');
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) {
      fetchMeetingData();
    }
  }, [meetingId, user, authLoading]);

  // Handle leaving the meeting
  const handleLeaveMeeting = () => {
    // Redirect back to dashboard or meetings page
    router.push('/dashboard');
  };

  // Check if the user is authorized to join this meeting
  const isAuthorized = user && meeting && 
    (meeting.senderId === user._id || meeting.receiverId === user._id);

  // Check if the meeting is in a valid state for joining
  const canJoinMeeting = meeting && 
    meeting.state === 'accepted' && 
    meeting.meetingLink && 
    new Date(meeting.meetingTime) <= new Date(Date.now() + 30 * 60 * 1000); // 30 minutes before

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--grayfill)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-lg text-[var(--textcolor)] opacity-60">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[var(--grayfill)] flex items-center justify-center">
        <div className="bg-[var(--bgcolor)] p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--textcolor)] mb-2">Meeting Not Available</h2>
            <p className="text-[var(--textcolor)] opacity-60 mb-6">
              {error || 'You are not authorized to access this meeting.'}
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!canJoinMeeting) {
    const meetingTime = new Date(meeting.meetingTime);
    const now = new Date();
    const timeUntilMeeting = meetingTime.getTime() - now.getTime();
    const isPastMeeting = timeUntilMeeting < -30 * 60 * 1000; // More than 30 minutes past
    const isTooEarly = timeUntilMeeting > 30 * 60 * 1000; // More than 30 minutes before

    return (
      <div className="min-h-screen bg-[var(--grayfill)] flex items-center justify-center">
        <div className="bg-[var(--bgcolor)] p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--textcolor)] mb-2">Meeting Not Available</h2>
            
            {meeting.state !== 'accepted' && (
              <p className="text-[var(--textcolor)] opacity-60 mb-6">
                This meeting has not been accepted yet.
              </p>
            )}
            
            {meeting.state === 'accepted' && !meeting.meetingLink && (
              <p className="text-[var(--textcolor)] opacity-60 mb-6">
                Meeting link is not available yet.
              </p>
            )}
            
            {meeting.state === 'accepted' && meeting.meetingLink && isTooEarly && (
              <div className="text-[var(--textcolor)] opacity-60 mb-6">
                <p>Meeting starts in:</p>
                <p className="text-lg font-semibold text-[var(--primary)]">
                  {(() => {
                    const minutesUntil = Math.floor(timeUntilMeeting / (1000 * 60));
                    if (minutesUntil >= 60) {
                      const hours = Math.floor(minutesUntil / 60);
                      return `${hours} hour${hours !== 1 ? 's' : ''}`;
                    }
                    return `${minutesUntil} minutes`;
                  })()}
                </p>
                <p className="text-sm mt-2">
                  You can join 30 minutes before the scheduled time.
                </p>
              </div>
            )}
            
            {meeting.state === 'accepted' && meeting.meetingLink && isPastMeeting && (
              <p className="text-[var(--textcolor)] opacity-60 mb-6">
                This meeting has ended.
              </p>
            )}
            
            <div className="space-y-3">
              <div className="bg-[var(--secondary)] p-4 rounded-lg">
                <h3 className="font-semibold text-[var(--textcolor)] mb-2">Meeting Details</h3>
                <p className="text-sm text-[var(--textcolor)] opacity-75">
                  <span className="font-medium">With:</span> {otherUser?.firstName} {otherUser?.lastName}
                </p>
                <p className="text-sm text-[var(--textcolor)] opacity-75">
                  <span className="font-medium">Scheduled:</span> {meetingTime.toLocaleString()}
                </p>
                <p className="text-sm text-[var(--textcolor)] opacity-75">
                  <span className="font-medium">Description:</span> {meeting.description}
                </p>
              </div>
              
              <Button onClick={() => router.push('/dashboard')} className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Meeting is available - render the Daily meeting component
  return (
    <div className="h-screen">
      <DailyMeeting
        roomUrl={meeting.meetingLink!}
        onLeave={handleLeaveMeeting}
        meetingId={meeting._id}
        userId={user?._id}
        userName={`${user?.firstName} ${user?.lastName}`}
        otherUserName={otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : undefined}
        meetingDescription={meeting.description}
      />
    </div>
  );
}
