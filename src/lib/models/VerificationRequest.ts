import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationRequest extends Document {
  userId: string;
  skillName: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRequestSchema = new Schema({
  userId: { type: String, required: true },
  skillName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  documents: [{ type: String }],
  description: { type: String },
}, { 
  timestamps: true 
});

const VerificationRequestModel = mongoose.models.VerificationRequest || 
  mongoose.model<IVerificationRequest>('VerificationRequest', VerificationRequestSchema);

export default VerificationRequestModel;