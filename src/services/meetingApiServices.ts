import Meeting from "@/types/meeting";

/**
 * Fetch meetings between two users
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
 * Create a new meeting
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
 * Update a meeting (accept, reject, cancel)
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
 * Count upcoming meetings between two users
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