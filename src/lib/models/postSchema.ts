import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  _id: string;
  forumId: mongoose.Types.ObjectId | string;
  title: string;
  content: string;
  author: {
    _id: mongoose.Types.ObjectId | string;
    name: string;
    avatar: string;
  };
  likes: number;
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
    author: {
      _id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
        default: '/default-avatar.png',
      },
    },
    likes: {
      type: Number,
      default: 0,
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

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);