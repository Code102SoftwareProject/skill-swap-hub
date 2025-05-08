import mongoose from "mongoose";

/**
 * MongoDB Schema for Know Your Customer (KYC) verification
 * Stores user identity verification details and approval status
 */
const KYCSchema = new mongoose.Schema({
  // National Identity Card number
  nic: { type: String, required: true },

  // User ID or email of the person submitting KYC
  recipient: { type: String, required: true },

  // Timestamp when KYC was submitted, defaults to current time
  dateSubmitted: { type: Date, default: Date.now },

  // Verification status - can be "Not Reviewed", "Accepted", or "Rejected"
  status: {
    type: String,
    enum: ["Not Reviewed", "Accepted", "Rejected"],
    default: "Not Reviewed",
  },

  // Timestamp when KYC was reviewed by an admin
  reviewed: { type: Date },

  // URL to stored image of user's NIC document
  nicUrl: { type: String },

  // URL to stored image of user holding their NIC (for verification)
  nicWithPersonUrl: { type: String },
});

/**
 * Export the KYC model
 * Check if model exists before creating to prevent duplicate model error in Next.js hot reloading
 */
const KYC = mongoose.models.KYC || mongoose.model("KYC", KYCSchema);
export default KYC;
