import mongoose, { Schema, Document } from "mongoose";

interface ISession extends Document {
  user1Id: mongoose.Types.ObjectId;
  skill1Id: mongoose.Types.ObjectId;
  descriptionOfService1: string;
  user2Id: mongoose.Types.ObjectId;
  skill2Id: mongoose.Types.ObjectId;
  descriptionOfService2: string;
  startDate: Date;
  expectedEndDate?: Date;
  isAccepted: boolean | null;
  isAmmended: boolean;
  status: "active" | "completed" | "canceled" | "pending" | "rejected";
  createdAt: Date;
  progress1?: mongoose.Types.ObjectId;
  progress2?: mongoose.Types.ObjectId;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
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
    expectedEndDate: { type: Date },
    isAccepted: { 
      type: Boolean, 
      required: false, 
      default: null 
    },
    status: {
      type: String,
      enum: ["active", "completed", "canceled","pending", "rejected"],
      default: "pending", 
    },
    progress1: { type: Schema.Types.ObjectId, ref: "SessionProgress" },
    progress2: { type: Schema.Types.ObjectId, ref: "SessionProgress" },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectedAt: { type: Date }
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