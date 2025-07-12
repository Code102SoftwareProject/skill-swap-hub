// Meeting Notification Helper Functions
// ====================================

// Import User model to fetch user names
const connectToDatabase = async () => {
  const { default: connect } = await import('../lib/db');
  await connect();
};

const getUserName = async (userId: string): Promise<string> => {
  try {
    await connectToDatabase();
    const { default: User } = await import('../lib/models/userSchema');
    const user = await User.findById(userId).select('firstName lastName');
    if (!user) return 'Unknown User';
    return `${user.firstName} ${user.lastName}`.trim();
  } catch (error) {
    console.error('Error fetching user name:', error);
    return 'Unknown User';
  }
};

/**
 * Send meeting notification to a user
 * @param {string} userId - The user ID to send notification to
 * @param {number} typeno - The notification type number
 * @param {string} description - The notification description
 * @param {string} targetDestination - Where the notification should redirect (optional)
 * @returns {Promise<boolean>} - Success status
 */
const sendMeetingNotification = async (userId: string, typeno: number, description: string, targetDestination: string = '/dashboard'): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notification`, {
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
};

/**
 * Send meeting request notification (when meeting is created)
 * @param {string} senderId - ID of user who sent the request
 * @param {string} receiverId - ID of user who received the request
 * @param {string} meetingId - Meeting ID for navigation
 */
const sendMeetingRequestNotifications = async (senderId: string, receiverId: string, meetingId: string): Promise<void> => {
  try {
    const senderName = await getUserName(senderId);
    const targetDestination = `/dashboard?tab=meetings`;
    
    // Notification to receiver: "John sent you a meeting request"
    await sendMeetingNotification(
      receiverId,
      5, // MEETING_REQUEST
      `${senderName} sent you a meeting request`,
      targetDestination
    );
    
    console.log(`Meeting request notification sent to receiver: ${receiverId}`);
  } catch (error) {
    console.error('Error sending meeting request notifications:', error);
  }
};

/**
 * Send meeting acceptance notification (when meeting is accepted)
 * @param {string} senderId - ID of original meeting requester
 * @param {string} accepterId - ID of user who accepted
 * @param {string} meetingId - Meeting ID for navigation
 */
const sendMeetingAcceptedNotification = async (senderId: string, accepterId: string, meetingId: string): Promise<void> => {
  try {
    const accepterName = await getUserName(accepterId);
    const targetDestination = `/meeting/${meetingId}`;
    
    await sendMeetingNotification(
      senderId,
      6, // MEETING_APPROVED_AND_SCHEDULED
      `${accepterName} accepted your meeting request`,
      targetDestination
    );
    
    console.log(`Meeting accepted notification sent to sender: ${senderId}`);
  } catch (error) {
    console.error('Error sending meeting accepted notification:', error);
  }
};

/**
 * Send meeting rejection notification (when meeting is rejected)
 * @param {string} senderId - ID of original meeting requester
 * @param {string} rejecterId - ID of user who rejected
 */
const sendMeetingRejectedNotification = async (senderId: string, rejecterId: string): Promise<void> => {
  try {
    const rejecterName = await getUserName(rejecterId);
    const targetDestination = `/dashboard?tab=meetings`;
    
    await sendMeetingNotification(
      senderId,
      25, // MEETING_REJECTED
      `${rejecterName} declined your meeting request`,
      targetDestination
    );
    
    console.log(`Meeting rejected notification sent to sender: ${senderId}`);
  } catch (error) {
    console.error('Error sending meeting rejected notification:', error);
  }
};

/**
 * Send meeting cancellation notification
 * @param {string} otherUserId - ID of the other user (not the canceller)
 * @param {string} cancellerId - ID of user who cancelled
 * @param {string} reason - Cancellation reason (optional)
 */
const sendMeetingCancelledNotification = async (otherUserId: string, cancellerId: string, reason: string = ''): Promise<void> => {
  try {
    const cancellerName = await getUserName(cancellerId);
    const targetDestination = `/dashboard?tab=meetings`;
    const description = `Meeting cancelled by ${cancellerName}${reason ? `: ${reason}` : ''}`;
    
    await sendMeetingNotification(
      otherUserId,
      10, // MEETING_CANCELLED
      description,
      targetDestination
    );
    
    console.log(`Meeting cancelled notification sent to user: ${otherUserId}`);
  } catch (error) {
    console.error('Error sending meeting cancelled notification:', error);
  }
};

/**
 * Send meeting reminder notification (for future use)
 * @param {string} userId - User to remind
 * @param {string} otherUserName - Name of the other meeting participant
 * @param {string} timeLeft - Time until meeting (e.g., "15 minutes")
 * @param {string} meetingId - Meeting ID for navigation
 */
const sendMeetingReminderNotification = async (userId: string, otherUserName: string, timeLeft: string, meetingId: string): Promise<void> => {
  const targetDestination = `/meeting/${meetingId}`;
  
  await sendMeetingNotification(
    userId,
    26, // MEETING_REMINDER
    `Meeting with ${otherUserName} starts in ${timeLeft}`,
    targetDestination
  );
};

/**
 * Send meeting started notification (when meeting is ready to join)
 * @param {string} userId - User to notify
 * @param {string} otherUserName - Name of the other meeting participant
 * @param {string} meetingId - Meeting ID for navigation
 */
const sendMeetingStartedNotification = async (userId: string, otherUserName: string, meetingId: string): Promise<void> => {
  const targetDestination = `/meeting/${meetingId}`;
  
  await sendMeetingNotification(
    userId,
    27, // MEETING_STARTED
    `Meeting with ${otherUserName} is ready to join`,
    targetDestination
  );
};

export {
  sendMeetingNotification,
  sendMeetingRequestNotifications,
  sendMeetingAcceptedNotification,
  sendMeetingRejectedNotification,
  sendMeetingCancelledNotification,
  sendMeetingReminderNotification,
  sendMeetingStartedNotification,
  getUserName
};
