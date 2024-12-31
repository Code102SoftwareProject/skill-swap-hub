import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string; // Change to string
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema<IUser>({
  _id: { type: String, required: true }, // Store ID as string
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
