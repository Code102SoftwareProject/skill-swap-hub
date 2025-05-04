import mongoose, { Document, CallbackError } from 'mongoose';
import Post from './postSchema';
import Reply from './replySchema';

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

forumSchema.pre('findOneAndDelete', async function(next) {
  try {
    const forumId = this.getQuery()._id;
    const posts = await Post.find({ forumId });
    if (posts && posts.length > 0) {
     
      const postIds = posts.map(post => post._id);
      await Reply.deleteMany({ postId: { $in: postIds } });
      await Post.deleteMany({ forumId });
    }
    
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

export const Forum = mongoose.models.Forum || mongoose.model<IForum>('Forum', forumSchema);