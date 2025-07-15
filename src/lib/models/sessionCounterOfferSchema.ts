import mongoose, { Schema, Document } from "mongoose";

interface ISessionCounterOffer extends Document {
  originalSessionId: mongoose.Types.ObjectId;
  counterOfferedBy: mongoose.Types.ObjectId; // user who made the counter offer
  skill1Id: mongoose.Types.ObjectId; // modified skill for user1
  descriptionOfService1: string; // modified description for user1
  skill2Id: mongoose.Types.ObjectId; // modified skill for user2
  descriptionOfService2: string; // modified description for user2
  startDate: Date; // modified start date
  expectedEndDate?: Date; // modified expected end date
  counterOfferMessage: string; // explanation of changes
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const sessionCounterOfferSchema = new Schema(
  {
    originalSessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    counterOfferedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    skill1Id: { type: Schema.Types.ObjectId, ref: "UserSkill", required: true },
    descriptionOfService1: { type: String, required: true },
    skill2Id: { type: Schema.Types.ObjectId, ref: "UserSkill", required: true },
    descriptionOfService2: { type: String, required: true },
    startDate: { type: Date, required: true },
    expectedEndDate: { type: Date },
    counterOfferMessage: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

sessionCounterOfferSchema.index({ originalSessionId: 1 });
sessionCounterOfferSchema.index({ counterOfferedBy: 1 });
sessionCounterOfferSchema.index({ status: 1 });
sessionCounterOfferSchema.index({ originalSessionId: 1, status: 1 });

export default mongoose.models.SessionCounterOffer || mongoose.model<ISessionCounterOffer>("SessionCounterOffer", sessionCounterOfferSchema);
