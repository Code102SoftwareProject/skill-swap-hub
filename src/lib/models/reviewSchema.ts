import mongoose, { Schema, Document } from "mongoose";

interface IReview extends Document {
  sessionId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId; // The user giving the review
  revieweeId: mongoose.Types.ObjectId; // The user being reviewed
  rating: number; // 1-5 stars
  comment: string;
  skillId: mongoose.Types.ObjectId; // Which skill was being taught/learned
  reviewType: "skill_teaching" | "skill_learning"; // Was this for teaching or learning a skill
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
      maxlength: 500 
    },
    skillId: { 
      type: Schema.Types.ObjectId, 
      ref: "UserSkill", 
      required: true 
    },
    reviewType: {
      type: String,
      enum: ["skill_teaching", "skill_learning"],
      required: true
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
reviewSchema.index({ skillId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ revieweeId: 1, isVisible: 1 });

// Compound indexes
reviewSchema.index({ revieweeId: 1, skillId: 1 });
reviewSchema.index({ sessionId: 1, reviewerId: 1 }, { unique: true }); // One review per user per session

export default mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);
