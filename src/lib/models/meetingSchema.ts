import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  description: string;
  sentAt: Date;
  meetingTime: Date;
  meetingLink: string | null;
  acceptStatus: boolean;
  state: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
}

const meetingSchema: Schema<IMeeting> = new Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  sentAt: { 
    type: Date, 
    default: Date.now 
  },
  meetingTime: {
    type: Date,
    required: true
  },
  meetingLink: {
    type: String,
    default: null
  },
  acceptStatus: {
    type: Boolean,
    default: false
  },
  state: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  }
});

// Create TTL index to automatically delete meetings 2 weeks after their scheduled time
meetingSchema.index({ meetingTime: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 }); // 14 days in seconds

export default mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', meetingSchema);