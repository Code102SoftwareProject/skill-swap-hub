import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatRoomId: mongoose.Types.ObjectId;
  senderId: string;
  content: string;
  sentAt: Date;
  readStatus: boolean;
  replyFor?: mongoose.Types.ObjectId | null;
}

const messageSchema: Schema<IMessage> = new Schema({
  chatRoomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChatRoom', 
    required: true 
  },
  senderId: { 
    type: String, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  sentAt: { 
    type: Date, 
    default: Date.now 
  },
  readStatus: { 
    type: Boolean, 
    default: false 
  },
  replyFor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message', 
    default: null
  },
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
