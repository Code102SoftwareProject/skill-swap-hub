// Import necessary parts of Mongoose
import mongoose, { Schema, model, models } from 'mongoose';

// ✅ Define the Admin schema
const adminSchema = new Schema({
  // Optional custom adminId (separate from _id), auto-generated
  adminId: {
    type: mongoose.Types.ObjectId,
    unique: true, // Ensures no duplicate adminId
    default: () => new mongoose.Types.ObjectId() // Auto-generate new ObjectId
  },

  // Username used for login (must be unique)
  username: {
    type: String,
    required: true, // Required for login
    unique: true    // Each admin must have a different username
  },

  // Admin's email address (also unique)
  email: {
    type: String,
    required: true, // Required for identification or recovery
    unique: true    // Prevent duplicate accounts
  },

  // Hashed password stored securely
  password: {
    type: String,
    required: true // Always required (should be hashed before storing)
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// ✅ Prevent model overwrite error in Next.js hot reload
const Admin = models.Admin || model("Admin", adminSchema);

// ✅ Export for use in routes (e.g., login, create, update)
export default Admin;
