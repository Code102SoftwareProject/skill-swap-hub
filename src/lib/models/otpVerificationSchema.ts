import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpVerification extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const OtpVerificationSchema: Schema = new Schema<IOtpVerification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  used: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 3600 // Auto delete after 1 hour
  }
});

// Check if the model already exists to prevent recompilation error during development
const OtpVerification = mongoose.models.OtpVerification || 
  mongoose.model<IOtpVerification>('OtpVerification', OtpVerificationSchema);

export default OtpVerification;