import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  participants: string[]; // Array of user IDs (strings)
  createdAt: Date;
}

const ChatRoomSchema: Schema<IChatRoom> = new Schema<IChatRoom>({
  participants: [{
    type: String,
    ref: 'users',
    required: true,
  }],
  createdAt: { type: Date, default: Date.now },
});

// Add validation for exactly 2 participants
ChatRoomSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error());
  }else{
    next();
  }
});

// Ensure unique chat rooms for the same pair of participants
ChatRoomSchema.index(
  { participants: 1 }, 
  { unique: true }
);

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);