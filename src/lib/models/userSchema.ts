import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  password: string;
  avatar?: string;
  badges?: mongoose.Types.ObjectId[]; // Array of badge IDs assigned to the user
  suspension: {
    isSuspended: boolean;
    suspendedAt?: Date;
    reason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true, trim: true },
    phone: { type: String, required: true },
    title: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String },
    badges: [{ type: Schema.Types.ObjectId, ref: "badge" }], // Array of badge references
    suspension: {
      isSuspended: { type: Boolean, default: false },
      suspendedAt: { type: Date },
      reason: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
// In userSchema.ts
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    console.log("Comparing passwords...");
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
