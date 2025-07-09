import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  participants: string[]; 
  createdAt: Date;
  lastMessage?: {
    content: string;
    sentAt: Date;
    senderId: string;
  };
}

const ChatRoomSchema: Schema<IChatRoom> = new Schema<IChatRoom>({
  participants: [{
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  createdAt: { type: Date, default: Date.now },
  lastMessage: {
    content: { type: String },
    sentAt: { type: Date },
    senderId: { type: String, ref: 'User' },
  },
});

//validation for exactly 2 participants
ChatRoomSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error());
  }else{
    next();
  }
});

// unique chat rooms for the same pair of participants
ChatRoomSchema.index(
  { 'participants.0': 1, 'participants.1': 1 }, 
  { unique: true }
);

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);