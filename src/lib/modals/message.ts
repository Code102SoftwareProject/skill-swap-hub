import { Schema, model, models } from "mongoose";

interface IMessage {
    mid: string;
    sender: Schema.Types.ObjectId;
    receiver: Schema.Types.ObjectId;
    text?: string;
    readStatus?: boolean;
    attachmentType?: "image" | "document" | null;
    attachmentUrl?: string;
}

const messageSchema = new Schema<IMessage>(
    {
        mid: { type: String, required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String },
        readStatus: { type: Boolean, default: false },
        attachmentType: {
            type: String,
            enum: ["image", "document"],
            default: null,
            validate: {
                validator: function (value: string) {
                    return value === null || ["image", "document"].includes(value);
                },
                message: "Invalid attachment type. Allowed values are 'image' or 'document'.",
            },
        },
        attachmentUrl: {
            type: String,
            validate: {
                validator: function (value: string) {
                    return (this as any).attachmentType ? !!value : true;
                },
                message: "Attachment URL is required when attachmentType is specified.",
            },
        },
    },
    {
        timestamps: true,
    }
);

export default models.Message || model("Message", messageSchema);
