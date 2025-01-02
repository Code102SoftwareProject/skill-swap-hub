import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatRoomId: mongoose.Types.ObjectId;
  senderId: string; // Store as string
  receiverId: string; // Store as string
  content?: string;
  attachment?: {
    url: string;
    type: 'image' | 'file';
  };
  sentAt: Date;
  readStatus: boolean;
}

const MessageSchema: Schema = new Schema<IMessage>({
  chatRoomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  senderId: { type: String, ref: 'User', required: true }, // Store as string
  receiverId: { type: String, ref: 'User', required: true }, // Store as string
  content: { type: String },
  attachment: {
    url: { type: String },
    type: { type: String, enum: ['image', 'file'], required: false },
  },
  sentAt: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false },
});

const messageSchema = new mongoose.Schema({
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;
