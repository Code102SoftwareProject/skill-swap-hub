import mongoose, { Document } from 'mongoose';
import Post from './postSchema';
export interface IForum extends Document {
  _id: string;
  title: string;
  description: string;
  posts: number;
  replies: number;
  lastActive: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  score?: number;
}

const forumSchema = new mongoose.Schema<IForum>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  posts: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  lastActive: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Middleware to delete posts when a forum is deleted
forumSchema.pre('findOneAndDelete', async function (next) {
  const forumId = this.getQuery()._id;
  await Post.deleteMany({ forumId });
  next();
});

export const Forum = mongoose.models.Forum || mongoose.model<IForum>('Forum', forumSchema);