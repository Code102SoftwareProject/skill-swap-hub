import mongoose, { Schema, Document } from "mongoose";

interface ISession extends Document {
  user1Id: mongoose.Types.ObjectId;
  skill1Id: mongoose.Types.ObjectId;
  descriptionOfService1: string;
  user2Id: mongoose.Types.ObjectId;
  skill2Id: mongoose.Types.ObjectId;
  descriptionOfService2: string;
  startDate: Date;
  isAccepted: boolean | null;
  isAmmended: boolean;
  status: "active" | "completed" | "canceled";
  createdAt: Date;
  progress1?: mongoose.Types.ObjectId;
  progress2?: mongoose.Types.ObjectId;
}

const sessionSchema = new Schema(
{
    user1Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    skill1Id: { type: Schema.Types.ObjectId, ref: "UserSkill", required: true },
    descriptionOfService1: { type: String, required: true },
    user2Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    skill2Id: { type: Schema.Types.ObjectId, ref: "UserSkill", required: true },
    descriptionOfService2: { type: String, required: true },
    startDate: { type: Date, required: true },
    // dueDate field removed as it's now stored in SessionProgress
    isAccepted: { 
      type: Boolean, 
      required: false, // Changed from required: true
      default: null 
    },
    isAmmended: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "completed", "canceled"],
      default: "active",
    },
    progress1: { type: Schema.Types.ObjectId, ref: "SessionProgress" },
    progress2: { type: Schema.Types.ObjectId, ref: "SessionProgress" }
  },
  { timestamps: true }
);

sessionSchema.index({ user1Id: 1 });
sessionSchema.index({ user2Id: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ isAccepted: 1 });
sessionSchema.index({ startDate: 1 });
sessionSchema.index({ user1Id: 1, status: 1 });
sessionSchema.index({ user2Id: 1, status: 1 });

export default mongoose.models.Session || mongoose.model<ISession>("Session",sessionSchema);