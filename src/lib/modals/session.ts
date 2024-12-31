import { Schema, model, models } from "mongoose";

const sessionSchema = new Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        user1Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        user2Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        status: { type: String, enum: ["active", "completed", "canceled"], required: true },
        duration: { type: Number }, // Duration in minutes or seconds, optional
    },
    { timestamps: true }
);

export default models.Session || model("Session", sessionSchema);
