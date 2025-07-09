import mongoose, { Schema, Document } from "mongoose";

interface IReview extends Document {
  sessionId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId; // The user giving the review
  revieweeId: mongoose.Types.ObjectId; // The user being reviewed
  rating: number; // 1-5 stars (integer)
  comment: string;
  isVisible: boolean; // Can be hidden if inappropriate
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema(
  {
    sessionId: { 
      type: Schema.Types.ObjectId, 
      ref: "Session", 
      required: true 
    },
    reviewerId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    revieweeId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5 
    },
    comment: { 
      type: String, 
      required: true,
      maxlength: 1000 
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes for better performance
reviewSchema.index({ revieweeId: 1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ sessionId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ revieweeId: 1, isVisible: 1 });

// Compound indexes
reviewSchema.index({ sessionId: 1, reviewerId: 1 }, { unique: true }); // One review per user per session
reviewSchema.index({ sessionId: 1, revieweeId: 1 }); // For finding reviews about a user in a session

export default mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);
