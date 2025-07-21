import mongoose from 'mongoose';

interface IMeetingEmailNotification {
  meetingId: mongoose.Types.ObjectId;
  senderNotified: boolean;
  receiverNotified: boolean;
  notificationSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IMeetingEmailNotificationModel extends mongoose.Model<IMeetingEmailNotification> {
  areBothUsersNotified(meetingId: mongoose.Types.ObjectId): Promise<boolean>;
  markUserNotified(meetingId: mongoose.Types.ObjectId, userType: 'sender' | 'receiver'): Promise<IMeetingEmailNotification>;
  getNotificationStatus(meetingId: mongoose.Types.ObjectId): Promise<IMeetingEmailNotification | null>;
}

const meetingEmailNotificationSchema = new mongoose.Schema<IMeetingEmailNotification>({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    unique: true, // Ensure only one notification record per meeting
    index: true
  },
  senderNotified: {
    type: Boolean,
    default: false,
    required: true
  },
  receiverNotified: {
    type: Boolean,
    default: false,
    required: true
  },
  notificationSentAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically handle createdAt and updatedAt
  collection: 'meetingEmailNotifications'
});

// Create compound index for efficient queries
meetingEmailNotificationSchema.index({ meetingId: 1, senderNotified: 1, receiverNotified: 1 });

// Pre-save middleware to update the updatedAt field
meetingEmailNotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to check if both users have been notified
meetingEmailNotificationSchema.statics.areBothUsersNotified = async function(meetingId: mongoose.Types.ObjectId): Promise<boolean> {
  const notification = await this.findOne({ meetingId });
  return notification ? (notification.senderNotified && notification.receiverNotified) : false;
};

// Static method to mark user as notified
meetingEmailNotificationSchema.statics.markUserNotified = async function(
  meetingId: mongoose.Types.ObjectId, 
  userType: 'sender' | 'receiver'
): Promise<IMeetingEmailNotification> {
  const updateField = userType === 'sender' ? 'senderNotified' : 'receiverNotified';
  
  return await this.findOneAndUpdate(
    { meetingId },
    { 
      [updateField]: true,
      notificationSentAt: new Date()
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

// Static method to get notification status for a meeting
meetingEmailNotificationSchema.statics.getNotificationStatus = async function(meetingId: mongoose.Types.ObjectId) {
  return await this.findOne({ meetingId });
};

const MeetingEmailNotification = (mongoose.models.MeetingEmailNotification || 
  mongoose.model<IMeetingEmailNotification, IMeetingEmailNotificationModel>('MeetingEmailNotification', meetingEmailNotificationSchema)) as IMeetingEmailNotificationModel;

export default MeetingEmailNotification;
export type { IMeetingEmailNotification };
