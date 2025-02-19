import mongoose, { Schema, model, models } from "mongoose";

const adminSchema = new Schema(
  {
    adminId: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Admin = models.Admin || model("Admin", adminSchema);

export default Admin;
