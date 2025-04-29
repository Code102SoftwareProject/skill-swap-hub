// lib/models/KYCSchema.ts

import mongoose from "mongoose";

// Define the schema structure for KYC records
const KYCSchema = new mongoose.Schema({
  // National ID Card number
  nic: { type: String, required: true },
  
  // User ID of the person submitting verification
  recipient: { type: String, required: true },
  
  // When the verification was submitted (defaults to current time)
  dateSubmitted: { type: Date, default: Date.now },
  
  // Current verification status with allowed values
  status: {
    type: String,
    enum: ["Not Reviewed", "Accepted", "Rejected"],
    default: "Not Reviewed",
  },
  
  // When the verification was reviewed by admin
  reviewed: { type: Date },
  
  // URL to stored NIC image/document
  nicUrl: { type: String },
  
  // URL to stored photo of person holding NIC front
  nicWithPersonUrl: { type: String },
});

// Export the compiled model (avoids recompilation issues in dev)
const KYC = mongoose.models.KYC || mongoose.model("KYC", KYCSchema);
export default KYC;
