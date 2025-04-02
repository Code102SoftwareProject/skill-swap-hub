// File: src/lib/models/skillListing.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillListing extends Document {
  userId: string;
  userDetails: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  // Skill the user is offering
  offering: {
    skillId?: string; // Optional reference to user's existing skills
    categoryId: number;
    categoryName: string;
    skillTitle: string;
    proficiencyLevel: 'Beginner' | 'Intermediate' | 'Expert';
    description: string;
  };
  // Skill the user is seeking
  seeking: {
    categoryId: number;
    categoryName: string;
    skillTitle: string;
  };
  additionalInfo: {
    description: string;
    availability?: string; // Optional availability timeframe
    tags?: string[]; // Optional tags for better search
  };
  status: 'active' | 'matched' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
}

const SkillListingSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userDetails: {
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
    }
  },
  offering: {
    skillId: {
      type: String,
      required: false // Can be optional if user wants to offer a skill not in their profile
    },
    categoryId: {
      type: Number,
      required: true
    },
    categoryName: {
      type: String,
      required: true
    },
    skillTitle: {
      type: String,
      required: true
    },
    proficiencyLevel: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Expert']
    },
    description: {
      type: String,
      required: true
    }
  },
  seeking: {
    categoryId: {
      type: Number,
      required: true
    },
    categoryName: {
      type: String,
      required: true
    },
    skillTitle: {
      type: String,
      required: true
    }
  },
  additionalInfo: {
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    availability: {
      type: String
    },
    tags: {
      type: [String]
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'matched', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
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

// Check if the model already exists to prevent recompilation during hot reloads
const SkillListing = mongoose.models.SkillListing || mongoose.model<ISkillListing>('SkillListing', SkillListingSchema);

export default SkillListing;