import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationRequest extends Document {
  userId: string;
  skillName: string;
  status: 'Pending' | 'Verified';
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
    enum: ['Pending', 'Verified'], 
    default: 'Pending' 
  },
  documents: [{ type: String }],
  description: { type: String },
}, { 
  timestamps: true 
});

// Renamed the model variable to avoid naming conflict
const VerificationRequestModel = mongoose.models.VerificationRequest || 
  mongoose.model<IVerificationRequest>('VerificationRequest', VerificationRequestSchema);

export default VerificationRequestModel;