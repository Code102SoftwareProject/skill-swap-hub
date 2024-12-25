import { Schema, model, models } from "mongoose";

const chatSchema = new Schema(
    {
        chatId: { type: String, required: true, unique: true },
        participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        messageList: [{ type: Schema.Types.ObjectId, ref: "Message" }],
        sessionList: [{ type: Schema.Types.ObjectId, ref: "Session" }],
        meetingList: [{ type: Schema.Types.ObjectId, ref: "Meeting" }],

    },
    { timestamps: true }
);

export default models.Chat || model("Chat", chatSchema);
