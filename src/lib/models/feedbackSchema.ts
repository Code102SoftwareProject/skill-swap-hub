import mongoose, { Document, Schema, model, Types } from 'mongoose';

export interface IFeedback extends Document {
  userId: Types.ObjectId;
  date: Date;
  
  // User-facing info
  feedback: string;
  successStory?: string;
  rating: number;
  
  // Consent + identity control
  canSuccessStoryPost: boolean;
  displayName?: string;
  isAnonymous: boolean;
  
  // Admin-controlled fields
  isPublished: boolean;
  adminTitle?: string;
}

const feedbackSchema = new Schema<IFeedback>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  feedback: {
    type: String,
    required: true,
    trim: true
  },
  successStory: {
    type: String,
    default: '',
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  canSuccessStoryPost: {
    type: Boolean,
    default: false
  },
  displayName: {
    type: String,
    default: undefined,// or you can use required: false
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  adminTitle: {
    type: String,
    default: '',
    trim: true
  }
});

export const Feedback = mongoose.models.Feedback || model<IFeedback>('Feedback', feedbackSchema);