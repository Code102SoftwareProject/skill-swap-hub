import mongoose, { Schema, model, models } from 'mongoose';

const KycSchema = new Schema({
  NIC: { type: String, required: true, unique: true },

}, { timestamps: true });

const AdminSchema = models.kyc || model("admin", KycSchema);
 

export default AdminSchema;
