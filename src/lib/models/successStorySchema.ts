import mongoose, { Schema, Document } from "mongoose";

export interface ISuccessStory extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  image?: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId; // Admin who created this story
  createdAt: Date;
  updatedAt: Date;
}

const SuccessStorySchema: Schema = new Schema<ISuccessStory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    image: {
      type: String,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
SuccessStorySchema.index({ userId: 1 });
SuccessStorySchema.index({ isPublished: 1 });
SuccessStorySchema.index({ createdBy: 1 });
SuccessStorySchema.index({ publishedAt: -1 });

// Check if the model already exists to prevent recompilation error during development
const SuccessStory = mongoose.models.SuccessStory || mongoose.model<ISuccessStory>("SuccessStory", SuccessStorySchema);

export default SuccessStory;
