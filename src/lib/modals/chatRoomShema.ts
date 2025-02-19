 import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  participants: string[]; // Array of user IDs (strings)
  createdAt: Date;
  lastMessage?: {
    content: string;
    sentAt: Date;
    senderId: string;
  };
}

const ChatRoomSchema: Schema<IChatRoom> = new Schema<IChatRoom>({
  participants: [
    { type: String, ref: 'User', required: true }, // store user IDs as strings
  ],
  createdAt: { type: Date, default: Date.now },
  lastMessage: {
    content: { type: String },
    sentAt: { type: Date },
    senderId: { type: String, ref: 'User' },
  },
});

// Create a compound index if needed (unique pairs)
ChatRoomSchema.index(
  { participants: 1 },
  { unique: true, partialFilterExpression: { "participants.1": { $exists: true } } }
);

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
