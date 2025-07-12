import mongoose, { Schema, Document } from "mongoose";

export interface ISuspendedUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  password?: string;
  avatar?: string;
  googleId?: string;
  isGoogleUser?: boolean;
  profileCompleted?: boolean;
  // Original user creation data
  originalCreatedAt: Date;
  originalUpdatedAt: Date;
  // Suspension data
  suspendedAt: Date;
  suspendedBy: string; // Admin ID who suspended the user
  suspensionReason: string;
  suspensionNotes?: string;
  // Original user data for reference
  originalUserId: string;
}

const SuspendedUserSchema: Schema = new Schema<ISuspendedUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true, trim: true },
    phone: { type: String, required: false },
    title: { type: String, required: false },
    password: { type: String, required: false },
    avatar: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    isGoogleUser: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    // Original user creation data
    originalCreatedAt: { type: Date, required: true },
    originalUpdatedAt: { type: Date, required: true },
    // Suspension data
    suspendedAt: { type: Date, default: Date.now },
    suspendedBy: { type: String, required: true },
    suspensionReason: { type: String, required: true },
    suspensionNotes: { type: String },
    // Original user data for reference
    originalUserId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Index for fast email lookup during registration
SuspendedUserSchema.index({ email: 1 });

// Helper method to return suspended user without password
SuspendedUserSchema.methods.toJSON = function () {
  const suspendedUser = this.toObject();
  delete suspendedUser.password;
  return suspendedUser;
};

const SuspendedUser =
  mongoose.models.SuspendedUser ||
  mongoose.model<ISuspendedUser>("SuspendedUser", SuspendedUserSchema);

export default SuspendedUser;
