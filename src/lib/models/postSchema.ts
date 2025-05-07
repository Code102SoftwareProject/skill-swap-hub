import mongoose, { Schema, Document } from 'mongoose';
import Reply from './replySchema';
export interface IPost extends Document {
  _id: string;
  forumId: mongoose.Types.ObjectId | string;
  title: string;
  content: string;
  imageUrl?: string | null;
  author: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar: string;
  };
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  replies: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema(
  {
    forumId: {
      type: Schema.Types.ObjectId,
      ref: 'Forum',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    author: {
      _id: {
        type: Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      name: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
        default: '/user-avatar.png',
      },
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [String],
      default: [],
    },
    dislikedBy: {
      type: [String],
      default: [],
    },
    replies: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
// Middleware to delete replies when a post is deleted
PostSchema.pre('findOneAndDelete', async function (next) {
  const postId = this.getQuery()._id;
  await Reply.deleteMany({ postId });
  next();
});

// Check if model exists before creating a new one (for Next.js hot reloading)
const Post = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;