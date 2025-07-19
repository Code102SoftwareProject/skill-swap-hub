import Meeting from "@/types/meeting";
import { debouncedApiService } from './debouncedApiService';
import { invalidateMeetingCache, invalidateUsersCaches } from './sessionApiServices';

// Notification helper functions
/**
 * Send meeting notification to a user
 * @param userId - The user ID to send notification to
 * @param typeno - The notification type number
 * @param description - The notification description
 * @param targetDestination - Where the notification should redirect (optional)
 * @returns Promise<boolean> - Success status
 */
async function sendMeetingNotification(userId: string, typeno: number, description: string, targetDestination: string = '/dashboard'): Promise<boolean> {
  try {
    const response = await fetch('/api/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        typeno,
        description,
        targetDestination
      })
    });

    if (!response.ok) {
      console.error('Failed to send meeting notification:', await response.text());
      return false;
    }

    console.log('Meeting notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending meeting notification:', error);
    return false;
  }
}

/**
 * Get user name for notifications
 * @param userId - User ID to fetch name for
 * @returns Promise<string> - User's full name
 */
async function getUserName(userId: string): Promise<string> {
  try {
    const response = await fetch(`/api/users/profile?id=${userId}`);
    const data = await response.json();
    
    if (data.success && data.user) {
      return `${data.user.firstName} ${data.user.lastName}`.trim();
    }
    
    return 'Unknown User';
  } catch (error) {
    console.error('Error fetching user name:', error);
    return 'Unknown User';
  }
}

/**
 ** Fetch meetings between two users
 * 
 * @param userId - ID of the first user
 * @param otherUserId - ID of the second user
 * @returns Promise that resolves to an array of Meeting objects between the specified users,
 *          or an empty array if the request fails
 */
export async function fetchMeetings(userId: string, otherUserId: string): Promise<Meeting[]> {
  const cacheKey = `meetings-${userId}-${otherUserId}`;
  
  return debouncedApiService.makeRequest(
    cacheKey,
    async () => {
      const response = await fetch(`/api/meeting?userId=${userId}&otherUserId=${otherUserId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching meetings: ${response.status}`);
      }
      
      return await response.json();
    },
    15000 // 15 second cache
  );
}

/**
 ** Create a new meeting between users
 * 
 * @param meetingData - Object containing meeting details
 * @param meetingData.senderId - ID of the user sending the meeting invitation
 * @param meetingData.receiverId - ID of the user receiving the meeting invitation
 * @param meetingData.description - Text description of the meeting purpose
 * @param meetingData.meetingTime - Date and time when the meeting will occur
 * @returns Promise that resolves to the created Meeting object if successful,
 *          or null if the request fails
 */
export async function createMeeting(meetingData: {
  senderId: string;
  receiverId: string;
  description: string;
  meetingTime: Date;
}): Promise<Meeting | null> {
  try {
    const response = await fetch('/api/meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meetingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error creating meeting: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Send notification to the receiver about the meeting request
    try {
      const senderName = await getUserName(meetingData.senderId);
      const targetDestination = `/dashboard?tab=meetings`;
      
      await sendMeetingNotification(
        meetingData.receiverId,
        5, // MEETING_REQUEST
        `${senderName} sent you a meeting request`,
        targetDestination
      );
      
      console.log('Meeting request notification sent successfully');
    } catch (notificationError) {
      console.error('Failed to send meeting request notification:', notificationError);
      // Continue even if notification fails
    }
    
    // Invalidate cache for both users
    invalidateUsersCaches(meetingData.senderId, meetingData.receiverId);
    
    return result;
  } catch (error) {
    console.error('Error creating meeting:', error);
    // Re-throw the error so calling code can handle the specific message
    throw error;
  }
}

/**
 **  Update a meeting's status (accept, reject, cancel)
 * 
 * @param meetingId - ID of the meeting to update
 * @param action - The action to perform on the meeting:
 *                'accept' - Accept the meeting invitation
 *                'reject' - Reject the meeting invitation
 *                'cancel' - Cancel a previously scheduled meeting
 * @returns Promise that resolves to the updated Meeting object if successful,
 *          or null if the request fails
 */
export async function updateMeeting(meetingId: string, action: 'accept' | 'reject' | 'cancel'): Promise<Meeting | null> {
  try {
    let response: Response;
    
    // Use dedicated reject endpoint for rejections
    if (action === 'reject') {
      response = await fetch('/api/meeting/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId }),
      });
    } else {
      // For other actions, use the existing PATCH endpoint
      const body: any = { _id: meetingId };
      
      if (action === 'accept') {
        body.acceptStatus = true;
      } else if (action === 'cancel') {
        body.state = 'cancelled';
      }
      
      response = await fetch('/api/meeting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    
    if (!response.ok) {
      throw new Error(`Error updating meeting: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Send notifications based on action
    if (result && result.senderId && result.receiverId) {
      const senderId = result.senderId._id || result.senderId;
      const receiverId = result.receiverId._id || result.receiverId;
      
      try {
        if (action === 'accept') {
          const accepterName = await getUserName(receiverId);
          await sendMeetingNotification(
            senderId,
            6, // MEETING_APPROVED_AND_SCHEDULED
            `${accepterName} accepted your meeting request`,
            `/meeting/${meetingId}`
          );
          console.log('Meeting acceptance notification sent successfully');
        } else if (action === 'reject') {
          const rejecterName = await getUserName(receiverId);
          await sendMeetingNotification(
            senderId,
            25, // MEETING_REJECTED
            `${rejecterName} declined your meeting request`,
            `/dashboard?tab=meetings`
          );
          console.log('Meeting rejection notification sent successfully');
        }
      } catch (notificationError) {
        console.error(`Failed to send meeting ${action} notification:`, notificationError);
        // Continue even if notification fails
      }
      
      // Invalidate cache for both users
      invalidateUsersCaches(senderId, receiverId);
    }
    
    return result;
  } catch (error) {
    console.error(`Error ${action}ing meeting:`, error);
    return null;
  }
}

/**
 ** Count upcoming meetings between two users
 * 
 * @param userId - ID of the first user
 * @param otherUserId - ID of the second user
 * @returns Promise that resolves to the number of upcoming meetings that are either:
 *          1. Accepted meetings between the users, or
 *          2. Pending meetings initiated by the first user (userId)
 *          Returns 0 if there are no upcoming meetings or an error occurs
 */
export async function fetchUpcomingMeetingsCount(userId: string, otherUserId: string): Promise<number> {
  try {
    const meetings = await fetchMeetings(userId, otherUserId);
    
    // Filter upcoming meetings
    const upcomingMeetings = meetings.filter(m => 
      (m.state === 'accepted' || (m.state === 'pending' && m.senderId === userId)) && 
      new Date(m.meetingTime) > new Date()
    );
    
    return upcomingMeetings.length;
  } catch (error) {
    console.error('Error counting upcoming meetings:', error);
    return 0;
  }
}

/**
 ** Fetch all meetings for a specific user (cached)
 * 
 * @param userId - ID of the user
 * @returns Promise that resolves to an array of Meeting objects for the specified user,
 *          or an empty array if the request fails
 */
export const fetchAllUserMeetings = async (userId: string): Promise<Meeting[]> => {
  const cacheKey = `user-meetings-${userId}`;
  
  return debouncedApiService.makeRequest(
    cacheKey,
    async () => {
      const response = await fetch(`/api/meeting?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      return data || [];
    },
    10000 // 10 second cache
  );
};

/**
 ** Cancel a meeting with a reason
 * 
 * @param meetingId - ID of the meeting to cancel
 * @param cancelledBy - ID of the user cancelling the meeting
 * @param reason - Reason for cancellation
 * @returns Promise that resolves to the updated Meeting object if successful,
 *          or null if the request fails
 */
export async function cancelMeetingWithReason(
  meetingId: string, 
  cancelledBy: string, 
  reason: string
): Promise<Meeting | null> {
  try {
    // Use relative URL for client-side requests
    const url = '/api/meeting/cancel';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId,
        cancelledBy,
        reason
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error cancelling meeting: ${response.status}`);
    }

    const { meeting } = await response.json();
    
    // Invalidate cache for both users
    if (meeting && meeting.senderId && meeting.receiverId) {
      const senderId = meeting.senderId._id || meeting.senderId;
      const receiverId = meeting.receiverId._id || meeting.receiverId;
      invalidateUsersCaches(senderId, receiverId);
    }
    
    return meeting;
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    throw error; // Re-throw the error so the UI can handle it properly
  }
}

/**
 ** Fetch cancellation details for a meeting
 * 
 * @param meetingId - ID of the meeting
 * @param userId - ID of the current user
 * @returns Promise that resolves to cancellation data or null
 */
export async function fetchMeetingCancellation(meetingId: string, userId: string) {
  const cacheKey = `cancellation-${meetingId}`;
  
  return debouncedApiService.makeRequest(
    cacheKey,
    async () => {
      const response = await fetch(`/api/meeting/cancellation?meetingId=${meetingId}&userId=${userId}`);
      if (!response.ok) return null;
      return await response.json();
    },
    300000 // 5 minute cache
  );
}

/**
 ** Acknowledge a meeting cancellation
 * 
 * @param cancellationId - ID of the cancellation to acknowledge
 * @param acknowledgedBy - ID of the user acknowledging
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function acknowledgeMeetingCancellation(
  cancellationId: string, 
  acknowledgedBy: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/meeting/cancellation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cancellationId,
        acknowledgedBy
      }),
    });

    if (response.ok) {
      // Invalidate the cache for this cancellation
      const cacheKey = `cancellation-${cancellationId}`;
      debouncedApiService.invalidate(cacheKey);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error acknowledging cancellation:', error);
    return false;
  }
}

/**
 ** Check if meeting notes exist for a meeting
 * 
 * @param meetingId - ID of the meeting
 * @param userId - ID of the current user
 * @returns Promise that resolves to boolean indicating if notes exist
 */
export async function checkMeetingNotesExist(meetingId: string, userId: string): Promise<boolean> {
  const cacheKey = `notes-check-${meetingId}-${userId}`;
  
  return debouncedApiService.makeRequest(
    cacheKey,
    async () => {
      const response = await fetch(`/api/meeting-notes?meetingId=${meetingId}&userId=${userId}`);
      const data = await response.json();
      return response.ok && data._id && data.content && data.content.trim().length > 0;
    },
    300000 // 5 minute cache
  );
}

/**
 ** Fetch meeting notes for download
 * 
 * @param meetingId - ID of the meeting
 * @param userId - ID of the current user
 * @returns Promise that resolves to meeting notes data or null
 */
export async function fetchMeetingNotes(meetingId: string, userId: string) {
  try {
    const response = await fetch(`/api/meeting-notes?meetingId=${meetingId}&userId=${userId}`);
    const data = await response.json();
    
    if (response.ok && data._id && data.content && data.content.trim().length > 0) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching meeting notes:', error);
    return null;
  }
}

/**
 ** Fetch all meeting notes for a user
 * 
 * @param userId - ID of the current user
 * @param otherUserId - Optional ID of the other user to filter notes for meetings with specific user
 * @returns Promise that resolves to array of meeting notes data
 */
export async function fetchAllUserMeetingNotes(userId: string, otherUserId?: string) {
  const cacheKey = `user-notes-${userId}${otherUserId ? `-${otherUserId}` : ''}`;
  
  return debouncedApiService.makeRequest(
    cacheKey,
    async () => {
      const url = `/api/meeting-notes/user?userId=${userId}${otherUserId ? `&otherUserId=${otherUserId}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching user meeting notes: ${response.status}`);
      }
      
      return await response.json();
    },
    60000 // 1 minute cache
  );
}

/**
 ** Filter meetings by type and user
 * 
 * @param meetings - Array of meetings to filter
 * @param userId - Current user ID
 * @returns Object containing categorized meetings
 */
export function filterMeetingsByType(meetings: Meeting[], userId: string) {
  const now = new Date();
  const thirtyMinutesInMs = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  return {
    pendingRequests: meetings.filter(m => 
      m.state === 'pending' && m.receiverId === userId && !m.acceptStatus
    ),
    
    upcomingMeetings: meetings.filter(m => {
      const meetingTime = new Date(m.meetingTime);
      const meetingEndBuffer = new Date(meetingTime.getTime() + thirtyMinutesInMs); // Add 30 minutes buffer
      
      return (m.state === 'accepted' || (m.state === 'pending' && m.senderId === userId)) && 
             meetingEndBuffer > now; // Keep visible until 30 minutes after meeting time
    }).sort((a, b) => new Date(a.meetingTime).getTime() - new Date(b.meetingTime).getTime()), // Sort by date (earliest first)
    
    pastMeetings: meetings.filter(m => {
      const meetingTime = new Date(m.meetingTime);
      const meetingEndBuffer = new Date(meetingTime.getTime() + thirtyMinutesInMs); // Add 30 minutes buffer
      
      return (m.state === 'completed' || m.state === 'accepted') && 
             meetingEndBuffer <= now; // Move to past only after 30 minutes buffer
    }),
    
    cancelledMeetings: meetings.filter(m => 
      m.state === 'cancelled' || m.state === 'rejected'
    )
  };
}

/**
 ** Check meeting limit for user
 * 
 * @param meetings - Array of meetings
 * @returns Number of active meetings
 */
export function checkMeetingLimit(meetings: Meeting[]): number {
  const now = new Date();
  const activeMeetings = meetings.filter(meeting => {
    const meetingTime = new Date(meeting.meetingTime);
    return (
      // Accepted meetings with future time
      (meeting.state === 'accepted' && meetingTime > now) ||
      // Pending meetings (not yet accepted/rejected)
      meeting.state === 'pending'
    );
  });
  
  return activeMeetings.length;
}

/**
 ** Get meeting status information
 * 
 * @param meeting - Meeting object
 * @param userId - Current user ID
 * @returns Object with status color and label
 */
export function getMeetingStatus(meeting: Meeting, userId: string) {
  const getStatusColor = () => {
    switch (meeting.state) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = () => {
    if (meeting.state === 'pending' && meeting.senderId === userId) {
      return 'Awaiting Response';
    }
    return meeting.state.charAt(0).toUpperCase() + meeting.state.slice(1);
  };

  return {
    color: getStatusColor(),
    label: getStatusLabel()
  };
}

/**
 ** Download meeting notes as markdown file
 * 
 * @param meetingId - ID of the meeting
 * @param userId - Current user ID
 * @param meetingTitle - Title for the meeting
 * @param meetingDate - Date of the meeting
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function downloadMeetingNotesFile(
  meetingId: string, 
  userId: string, 
  meetingTitle: string, 
  meetingDate: string
): Promise<boolean> {
  try {
    const data = await fetchMeetingNotes(meetingId, userId);
    
    if (!data || !data.content || data.content.trim().length === 0) {
      throw new Error('No notes content found for this meeting');
    }

    // Create a well-formatted markdown document
    const formattedDate = new Date(meetingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = new Date(meetingDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Keep markdown formatting intact and clean it up
    let formattedContent = data.content
      .replace(/^## (.*$)/gm, '## $1')  // Ensure proper heading format
      .replace(/^# (.*$)/gm, '# $1')    // Ensure proper heading format
      .replace(/^> (.*$)/gm, '> $1')    // Ensure proper quote format
      .replace(/^- (.*$)/gm, '- $1')    // Ensure proper list format
      .trim();

    const wordCount = data.content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    
    const markdownDocument = `# Meeting Notes

---

## Meeting Information

- **Meeting:** ${data.title || meetingTitle}
- **Date:** ${formattedDate}
- **Time:** ${formattedTime}
- **Meeting ID:** \`${meetingId}\`
- **Author:** ${data.userName || 'Unknown'}

---

## Content

${formattedContent}

---

## Meeting Details

- **Word Count:** ${wordCount}
- **Tags:** ${data.tags?.join(', ') || 'None'}
- **Created:** ${new Date(data.createdAt || meetingDate).toLocaleDateString()}
- **Last Updated:** ${data.lastModified ? new Date(data.lastModified).toLocaleDateString() : 'N/A'}

---

*Generated by SkillSwap Hub - Meeting Notes System*
    `;
    
    // Create and trigger download
    const blob = new Blob([markdownDocument], { type: 'text/markdown;charset=utf-8' });
    
    // Check if browser supports download
    if (typeof window === 'undefined') {
      throw new Error('Download not supported in server environment');
    }
    
    const url = URL.createObjectURL(blob);
    const fileName = `meeting-notes-${meetingId}-${new Date(meetingDate).toISOString().split('T')[0]}.md`;
    
    // Try modern download approach first
    if ((navigator as any).msSaveBlob) {
      // IE 10+
      (navigator as any).msSaveBlob(blob, fileName);
    } else {
      // Modern browsers
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      
      // Add to DOM, click, and remove
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
    
    console.log('Download triggered successfully for:', fileName);
    return true;
  } catch (error) {
    console.error('Error downloading notes:', error);
    throw error; // Re-throw to let the caller handle the error properly
  }
}

/**
 ** Check if a meeting can be cancelled based on timing rules
 * 
 * @param meeting - Meeting object to check
 * @returns Object with canCancel boolean and reason message if cannot cancel
 */
export function canCancelMeeting(meeting: Meeting): { canCancel: boolean; reason?: string } {
  // Only accepted meetings have timing restrictions
  if (meeting.state !== 'accepted') {
    return { canCancel: true };
  }

  const now = new Date();
  const meetingTime = new Date(meeting.meetingTime);
  const tenMinutesBefore = new Date(meetingTime.getTime() - 10 * 60 * 1000); // 10 minutes before
  const thirtyMinutesAfter = new Date(meetingTime.getTime() + 30 * 60 * 1000); // 30 minutes after

  // Check if meeting is too close to start time or currently in progress
  if (now >= tenMinutesBefore && now <= thirtyMinutesAfter) {
    const timeUntilMeeting = meetingTime.getTime() - now.getTime();
    const timeAfterMeeting = now.getTime() - meetingTime.getTime();
    
    let reason;
    if (timeUntilMeeting > 0) {
      const minutesUntil = Math.ceil(timeUntilMeeting / (1000 * 60));
      reason = `Cannot cancel meeting. The meeting starts in ${minutesUntil} minute${minutesUntil === 1 ? '' : 's'}. Meetings cannot be cancelled within 10 minutes of the start time.`;
    } else {
      const minutesAfter = Math.floor(timeAfterMeeting / (1000 * 60));
      reason = `Cannot cancel meeting. The meeting started ${minutesAfter} minute${minutesAfter === 1 ? '' : 's'} ago and may still be in progress. Meetings cannot be cancelled for up to 30 minutes after the start time.`;
    }
    
    return { canCancel: false, reason };
  }

  return { canCancel: true };
}