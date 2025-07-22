import mongoose, { Document, Schema } from 'mongoose';

export interface IPostView extends Document {
  _id: string;
  postId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  visitorId?: string | null;
  forumId: mongoose.Types.ObjectId;
  viewedAt: Date;
  timeSpent: number; // in seconds
  deviceType: 'mobile' | 'desktop' | 'tablet';
  isComplete: boolean; // if user scrolled to the end
}

const PostViewSchema = new Schema<IPostView>({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null
  },
  visitorId: {
    type: String,
    index: true,
    default: null
  },
  forumId: {
    type: Schema.Types.ObjectId,
    ref: 'Forum',
    required: true,
    index: true
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet'],
    default: 'desktop'
  },
  isComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
PostViewSchema.index({ userId: 1, postId: 1 });
PostViewSchema.index({ visitorId: 1, postId: 1 });
PostViewSchema.index({ userId: 1, viewedAt: -1 });
PostViewSchema.index({ visitorId: 1, viewedAt: -1 });
PostViewSchema.index({ postId: 1, viewedAt: -1 });
PostViewSchema.index({ forumId: 1, viewedAt: -1 });

const PostView = mongoose.models.PostView || mongoose.model<IPostView>('PostView', PostViewSchema);

export default PostView;
