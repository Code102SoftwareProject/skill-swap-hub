import { Schema, model, models } from "mongoose";

const typingIndicatorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    isTyping: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default models.TypingIndicator ||
  model("TypingIndicator", typingIndicatorSchema);