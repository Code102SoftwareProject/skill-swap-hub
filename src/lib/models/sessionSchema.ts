import { Schema, model, models } from "mongoose";

const sessionSchema = new Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        user1Id: { type: Schema.Types.ObjectId, ref: "users", required: true },
        skill1Id: { type: Schema.Types.ObjectId, ref: "skill", required: true },
        descriptionOfService1: { type: String, required: true },
        descriptionOfService2: { type: String, required: true },
        user2Id: { type: Schema.Types.ObjectId, ref: "users", required: true },
        skill2Id: { type: Schema.Types.ObjectId, ref: "skill", required: true },
        startDate: { type: Date, required: true },
        dueDate: { type: Date },
        isAccepted: { type: Boolean, required: true, default: null },
        isAmmended: { type: Boolean, required: true, default: false },
        status: { type: String, enum: ["active", "completed", "canceled"], required: true ,default: null}
    },
    { timestamps: true }
);

export default models.Session || model("Session", sessionSchema);
