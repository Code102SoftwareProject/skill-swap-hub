import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  participants: bigint[]; // Array of user IDs
  createdAt: Date;
  lastMessage?: {
    content: string;
    sentAt: Date;
    senderId: bigint;
  };
}

const ChatRoomSchema: Schema = new Schema<IChatRoom>({
  participants: [
    { type: Schema.Types.Mixed, ref: 'User', required: true },
  ],
  createdAt: { type: Date, default: Date.now },
  lastMessage: {
    content: { type: String },
    sentAt: { type: Date },
    senderId: { type: Schema.Types.Mixed, ref: 'User' },
  },
});

// Ensure unique pairing of participants
ChatRoomSchema.index(
  { participants: 1 },
  { unique: true, partialFilterExpression: { "participants.1": { $exists: true } } }
);

// Ensure only two participants are allowed
ChatRoomSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('A chat room must have exactly two participants.'));
  }
  next();
});

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
