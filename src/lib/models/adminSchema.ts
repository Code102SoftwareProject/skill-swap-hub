// Import necessary parts of Mongoose
import mongoose, { Schema, model, models } from "mongoose";

//  Define the Admin schema
const adminSchema = new Schema(
  {
    // Optional custom adminId (separate from _id), auto-generated
    adminId: {
      type: mongoose.Types.ObjectId,
      unique: true, // Ensures no duplicate adminId
      default: () => new mongoose.Types.ObjectId(), // Auto-generate new ObjectId
    },

    // Username used for login (must be unique)
    username: {
      type: String,
      required: true, // Required for login
      unique: true, // Each admin must have a different username
    },

    // Admin's email address (also unique)
    email: {
      type: String,
      required: true, // Required for identification or recovery
      unique: true, // Prevent duplicate accounts
    },

    // Hashed password stored securely
    password: {
      type: String,
      required: true, // Always required (should be hashed before storing)
    },

    // Admin role - either 'super_admin' or 'admin'
    role: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin",
      required: true,
    },

    // ID of the super admin who created this admin (null for super admins)
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // Admin status - active, inactive, suspended
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      required: true,
    },

    // Permissions array for granular access control
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save middleware to set default permissions based on role
adminSchema.pre("save", function (next) {
  // Only set default permissions if permissions array is empty
  if (this.permissions.length === 0) {
    // Base permissions that all admins have
    const baseAdminPermissions = [
      "manage_users",
      "manage_kyc",
      "manage_suggestions",
      "manage_verification",
      "manage_reporting",
      "manage_system",
      "manage_success_stories", // Added success stories permission
      "view_dashboard",
    ];

    if (this.role === "super_admin") {
      // Super admins get all base permissions + admin management
      this.permissions = [
        ...baseAdminPermissions,
        "manage_admins", // Only super admins can manage other admins
      ];
    } else {
      // Normal admins get all base permissions except admin management
      this.permissions = [...baseAdminPermissions];
    }
  }
  next();
});

//  Prevent model overwrite error in Next.js hot reload
const Admin = models.Admin || model("Admin", adminSchema);

//  Export for use in routes (e.g., login, create, update)
export default Admin;
