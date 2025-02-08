import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  chatRoomId: mongoose.Types.ObjectId;
  senderId: string; // Changed to senderId
  receiverId: string; // Changed to receiverId
  content: string;
  sentAt: Date;
  readStatus: boolean;
}

const messageSchema: Schema<IMessage> = new Schema({
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  senderId: { type: String, ref: "User", required: true }, // senderId
  receiverId: { type: String, ref: "User", required: true }, // receiverId
  // Changed to receiverId
  content: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false },
});

// Force model recreation
mongoose.models = {};

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
