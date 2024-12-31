import { Schema, model, models } from "mongoose";

const adminSchema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        hashedPassword: { type: String, required: true },
    },
    { timestamps: true }
);

const Admin = models.Admin || model('Admin', adminSchema);

export default Admin;
