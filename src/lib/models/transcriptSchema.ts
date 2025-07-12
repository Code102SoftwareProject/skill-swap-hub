import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscript extends Document {
  meetingId: string;
  userId: string;
  userName: string;
  content: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSchema = new Schema<ITranscript>({
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  participants: [{
    type: String,
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
TranscriptSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient querying
TranscriptSchema.index({ meetingId: 1, userId: 1 });
TranscriptSchema.index({ createdAt: -1 });

const Transcript = mongoose.models.Transcript || mongoose.model<ITranscript>('Transcript', TranscriptSchema);

export default Transcript;
