import Meeting from "@/types/meeting";

/**
 ** Fetch meetings between two users
 * 
 * @param userId - ID of the first user
 * @param otherUserId - ID of the second user
 * @returns Promise that resolves to an array of Meeting objects between the specified users,
 *          or an empty array if the request fails
 */
export async function fetchMeetings(userId: string, otherUserId: string): Promise<Meeting[]> {
  try {
    const response = await fetch(`/api/meeting?userId=${userId}&otherUserId=${otherUserId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching meetings: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return [];
  }
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
      throw new Error(`Error creating meeting: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating meeting:', error);
    return null;
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
    const body: any = { _id: meetingId };
    
    if (action === 'accept') {
      body.acceptStatus = true;
    } else if (action === 'reject' || action === 'cancel') {
      body.state = action === 'reject' ? 'rejected' : 'cancelled';
    }
    
    const response = await fetch('/api/meeting', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating meeting: ${response.status}`);
    }
    
    return await response.json();
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