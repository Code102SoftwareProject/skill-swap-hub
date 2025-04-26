// lib/models/KYCSchema.ts

import mongoose from "mongoose";

// Define the schema structure for KYC records
const KYCSchema = new mongoose.Schema({
  nic: { type: String, required: true },
  recipient: { type: String, required: true },
  dateSubmitted: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Not Reviewed", "Accepted", "Rejected"],
    default: "Not Reviewed",
  },
  reviewed: { type: Date },
  nicUrl: { type: String } // Uncommented nicUrl field
});

// Export the compiled model (avoids recompilation issues in dev)
const KYC = mongoose.models.KYC || mongoose.model("KYC", KYCSchema);
export default KYC;
