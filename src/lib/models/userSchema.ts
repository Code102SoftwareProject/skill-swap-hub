import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  password?: string; // Optional for Google OAuth users
  avatar?: string;
  // Google OAuth fields
  googleId?: string;
  isGoogleUser?: boolean;
  // Flag to track if user needs to complete profile
  profileCompleted?: boolean;
  // Suspension info
  suspension: {
    isSuspended: boolean;
    suspendedAt?: Date;
    reason?: string;
  };
  // Soft delete flag
  isDeleted?: boolean;
  isBlocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true, trim: true },
    phone: { type: String, required: false },
    title: { type: String, required: false },
    password: { type: String, required: false },
    avatar: { type: String },
    // Google OAuth fields
    googleId: { type: String, unique: true, sparse: true },
    isGoogleUser: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    // Suspension info
    suspension: {
      isSuspended: { type: Boolean, default: false },
      suspendedAt: { type: Date },
      reason: { type: String },
    },
    // Soft delete flag
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash the password if it exists and has been modified (or is new)
  if (!this.password || !this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // If no password is set, return false (regardless of Google user status)
    if (!this.password) {
      console.log("No password set for this user");
      return false;
    }

    console.log("Comparing passwords...");
    console.log("User type:", this.isGoogleUser ? "Google user" : "Regular user");
    console.log("Candidate password length:", candidatePassword.length);
    console.log("Stored password hash length:", this.password.length);

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password match result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

// Helper method to return user without password
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Check if the model already exists to prevent recompilation error during development
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
