import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreference extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  forumInterests: string[]; // Forum IDs user is interested in
  watchedPosts: mongoose.Types.ObjectId[]; // Post IDs user is watching
  likedCategories: string[]; // Categories user frequently interacts with
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  };
  interactionHistory: {
    postId: mongoose.Types.ObjectId;
    forumId: mongoose.Types.ObjectId;
    interactionType: 'view' | 'like' | 'dislike' | 'comment' | 'share';
    timestamp: Date;
    timeSpent?: number; // in seconds
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferenceSchema = new Schema<IUserPreference>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  forumInterests: [{
    type: String,
    index: true
  }],
  watchedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post',
    index: true
  }],
  likedCategories: [{
    type: String,
    index: true
  }],
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    digestFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    }
  },
  interactionHistory: [{
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    forumId: {
      type: Schema.Types.ObjectId,
      ref: 'Forum',
      required: true
    },
    interactionType: {
      type: String,
      enum: ['view', 'like', 'dislike', 'comment', 'share'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
UserPreferenceSchema.index({ userId: 1, 'interactionHistory.postId': 1 });
UserPreferenceSchema.index({ userId: 1, 'interactionHistory.timestamp': -1 });
UserPreferenceSchema.index({ userId: 1, 'interactionHistory.interactionType': 1 });

const UserPreference = mongoose.models.UserPreference || mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema);

export default UserPreference;
