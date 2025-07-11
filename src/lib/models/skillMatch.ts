// File: src/lib/models/skillMatch.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillMatch extends Document {
  listingOneId: string;
  listingTwoId: string;
  userOneId: string;
  userTwoId: string;
  matchPercentage: number; // 50 for partial, 100 for exact
  matchType: 'exact' | 'partial';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  
  // User details for quick access (denormalized for performance)
  userOneDetails: {
    firstName: string;
    lastName: string;
    avatar?: string;
    offeringSkill: string;
    seekingSkill: string;
  };
  
  userTwoDetails: {
    firstName: string;
    lastName: string;
    avatar?: string;
    offeringSkill: string;
    seekingSkill: string;
  };
  
  createdAt: Date;
  updatedAt?: Date;
  id?: string; // Add id property for the transformation
}

const SkillMatchSchema: Schema = new Schema({
  listingOneId: {
    type: String,
    required: true,
    index: true
  },
  listingTwoId: {
    type: String,
    required: true,
    index: true
  },
  userOneId: {
    type: String,
    required: true,
    index: true
  },
  userTwoId: {
    type: String,
    required: true,
    index: true
  },
  matchPercentage: {
    type: Number,
    required: true,
    enum: [50, 100] // Only partial (50%) or exact (100%) matches
  },
  matchType: {
    type: String,
    required: true,
    enum: ['exact', 'partial']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  userOneDetails: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    avatar: {
      type: String
    },
    offeringSkill: {
      type: String,
      required: true
    },
    seekingSkill: {
      type: String,
      required: true
    }
  },
  userTwoDetails: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    avatar: {
      type: String
    },
    offeringSkill: {
      type: String,
      required: true
    },
    seekingSkill: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Compound indexes for efficient queries
SkillMatchSchema.index({ userOneId: 1, status: 1 });
SkillMatchSchema.index({ userTwoId: 1, status: 1 });
SkillMatchSchema.index({ listingOneId: 1, listingTwoId: 1 }, { unique: true }); // Prevent duplicate matches
SkillMatchSchema.index({ status: 1, matchType: 1 });
SkillMatchSchema.index({ createdAt: -1 }); // For trending analysis

// Check if the model already exists to prevent recompilation during hot reloads
const SkillMatch = mongoose.models.SkillMatch || mongoose.model<ISkillMatch>('SkillMatch', SkillMatchSchema);

export default SkillMatch;