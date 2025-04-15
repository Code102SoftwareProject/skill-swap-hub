import mongoose from "mongoose";

const KYCSchema = new mongoose.Schema({
  nic: String,
  recipient: String,
  dateSubmitted: String,
  status: String,
  reviewed: String,
});

const KYC = mongoose.models.KYC || mongoose.model("KYC", KYCSchema);
export default KYC;
