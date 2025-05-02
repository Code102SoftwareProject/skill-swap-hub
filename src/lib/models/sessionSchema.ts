import mongoose, { Schema, Document } from "mongoose";

interface ISession{
  user1Id: mongoose.Types.ObjectId;
  skill1Id: mongoose.Types.ObjectId;
  descriptionOfService1: string;
  user2Id: mongoose.Types.ObjectId;
  skill2Id: mongoose.Types.ObjectId;
  descriptionOfService2: string;
  requestedDate: Date;
  startDate:Date;
  dueDate: Date;
  isAccepted: boolean;
  isAmmended: boolean;
  status: "active" | "completed" | "canceled";
  createdAt: Date;
  progress1: mongoose.Types.ObjectId;
  progress2: mongoose.Types.ObjectId;
}

const sessionSchema = new Schema(
{
        //sessionId 
        user1Id: { type: Schema.Types.ObjectId, ref: "users", required: true },
        skill1Id: { type: Schema.Types.ObjectId, ref: "skill", required: true },
        descriptionOfService1: { type: String, required: true },
        user2Id: { type: Schema.Types.ObjectId, ref: "users", required: true },
        skill2Id: { type: Schema.Types.ObjectId, ref: "skill", required: true },
        descriptionOfService2: { type: String, required: true },
        startDate: { type: Date, required: true },
        dueDate: { type: Date },
        isAccepted: { type: Boolean, required: true, default: null },
        isAmmended: { type: Boolean, required: true, default: false },
        status: { type: String, enum: ["active", "completed", "canceled"], required: true ,default: null}
    },
    { timestamps: true }
);


