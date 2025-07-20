import mongoose from "mongoose";

/**
 * MongoDB Schema for Know Your Customer (KYC) verification
 * Stores user identity verification details and approval status
 */
const KYCSchema = new mongoose.Schema({
  // National Identity Card number
  nic: { type: String, required: true },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

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

  // Reason why an admin rejected this KYC (required when status === "Rejected")
  rejectionReason: {
    type: String,
    required: [
      // annotate `this` so TS knows it has a `.status`
      function (this: any): boolean {
        return this.status === "Rejected";
      },
      "Rejection reason is required",
    ],
 },
});

/**
 * Export the KYC model
 * Check if model exists before creating to prevent duplicate model error in Next.js hot reloading
 */
const KYC = mongoose.models.KYC || mongoose.model("KYC", KYCSchema);
export default KYC;
