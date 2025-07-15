// Import the KYC Mongoose model
import KYC from "./models/KYCSchema";

// Import the MongoDB connection utility
import Connect from "@/lib/db";

// Fetch KYC records from MongoDB
export const fetchKYCRecords = async () => {
  // Ensure a connection to MongoDB is established
  await Connect();

  // Retrieve all KYC records, sorted by date (most recent first)
  return await KYC.find().sort({ dateSubmitted: -1 });
};
