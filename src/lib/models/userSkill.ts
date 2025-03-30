// File: src/lib/models/userSkill.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSkill extends Document {
  userId: string;
  categoryId: number;
  categoryName: string;
  skillTitle: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Expert';
  description: string;
  createdAt: Date;
  updatedAt?: Date;
}

const UserSkillSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
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
    required: true,
    minlength: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
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

// Compound index to ensure a user doesn't have duplicate skills
UserSkillSchema.index({ userId: 1, skillTitle: 1 }, { unique: true });

// Check if the model already exists to prevent overwriting during hot reloads
const UserSkill = mongoose.models.UserSkill || mongoose.model<IUserSkill>('UserSkill', UserSkillSchema);

export default UserSkill;