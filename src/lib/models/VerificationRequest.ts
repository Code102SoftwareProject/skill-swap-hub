import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationRequest extends Document {
  userId: string;
  skillId: mongoose.Types.ObjectId;
  skillName: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
  description: string;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRequestSchema = new Schema({
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  skillId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    ref: 'UserSkill'
  },
  skillName: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  documents: [{ type: String }],
  description: { type: String },
  feedback: { type: String },
}, { 
  timestamps: true,
  collection: 'userskillverificationrequests', // Specify the collection name here
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

// Compound index to prevent duplicate verification requests for the same skill
VerificationRequestSchema.index({ userId: 1, skillId: 1, status: 1 }, { 
  unique: true,
  partialFilterExpression: { status: "pending" } // Only enforce uniqueness for pending requests
});

// Update the model name to maintain consistency
const VerificationRequestModel = mongoose.models.VerificationRequest || 
  mongoose.model<IVerificationRequest>('VerificationRequest', VerificationRequestSchema);

export default VerificationRequestModel;