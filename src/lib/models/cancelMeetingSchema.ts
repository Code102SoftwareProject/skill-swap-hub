import mongoose, { Schema, Document } from 'mongoose';

export interface ICancelMeeting extends Document {
  meetingId: mongoose.Types.ObjectId;
  cancelledBy: mongoose.Types.ObjectId;
  reason: string;
  cancelledAt: Date;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  acknowledgedBy: mongoose.Types.ObjectId | null;
}

const cancelMeetingSchema: Schema<ICancelMeeting> = new Schema({
  meetingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Meeting', 
    required: true 
  },
  cancelledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  reason: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  cancelledAt: { 
    type: Date, 
    default: Date.now 
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Index for efficient querying
cancelMeetingSchema.index({ meetingId: 1 });
cancelMeetingSchema.index({ cancelledBy: 1 });

export default mongoose.models.CancelMeeting || mongoose.model<ICancelMeeting>('CancelMeeting', cancelMeetingSchema);