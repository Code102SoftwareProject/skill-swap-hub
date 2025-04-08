// File: src/lib/models/skillMatch.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillMatch extends Document {
  // The two listings involved in the match
  listingOneId: string;  // First listing in the match
  listingTwoId: string;  // Second listing in the match
  
  // The users involved in the match
  userOneId: string;     // User who created the first listing
  userTwoId: string;     // User who created the second listing
  
  // Match details
  matchPercentage: number;  // 50 for partial, 100 for exact
  matchType: 'exact' | 'partial';
  
  // Match status
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  
  // Additional data for UI display
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
    enum: [50, 100]  // Only allow 50% or 100% matches
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
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
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

// Compound index to ensure uniqueness of matches
SkillMatchSchema.index({ listingOneId: 1, listingTwoId: 1 }, { unique: true });

// Check if the model already exists to prevent overwriting during hot reloads
const SkillMatch = mongoose.models.SkillMatch || mongoose.model<ISkillMatch>('SkillMatch', SkillMatchSchema);

export default SkillMatch;