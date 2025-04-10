import mongoose, { Schema, model, models } from 'mongoose';

const adminSchema = new Schema({
  adminId: { type: mongoose.Types.ObjectId },
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const AdminSchema = models.admin || model("admin", adminSchema);
 

export default AdminSchema;

