import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatRoomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  sentAt: Date;
  readStatus: boolean;
  replyFor?: mongoose.Types.ObjectId | null;
  deliveryStatus?: 'sent' | 'delivered' | 'read';
}

const messageSchema: Schema<IMessage> = new Schema({
  chatRoomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChatRoom', 
    required: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
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
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
});

// indexes for better query performance
messageSchema.index({ chatRoomId: 1, sentAt: -1 }); // Messages by chat room, sorted by time
messageSchema.index({ senderId: 1 }); // Messages by sender
messageSchema.index({ replyFor: 1 }); // Messages that are replies

export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
