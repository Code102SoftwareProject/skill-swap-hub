import KYC from "./models/KYCSchema";
import dbConnect from '@/lib/db';

export const fetchKYCRecords = async () => {
  await dbConnect();
  return await KYC.find().sort({ dateSubmitted: -1 });
};
