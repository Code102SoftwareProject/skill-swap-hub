import mongoose, { Document, Schema } from 'mongoose';

export interface IReply extends Document {
  postId: mongoose.Types.ObjectId;
  content: string;
  author: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
}

const ReplySchema = new Schema<IReply>({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
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
    avatar: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
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
});

// Check if the model is already defined to prevent OverwriteModelError during hot reloads
const Reply = mongoose.models.Reply || mongoose.model<IReply>('Reply', ReplySchema);

export default Reply;