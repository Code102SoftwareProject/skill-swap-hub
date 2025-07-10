import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define the Admin schema
const adminSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Types.ObjectId,
      unique: true,
      default: () => new mongoose.Types.ObjectId(),
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin",
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "skillSwapHub",
      bufferCommands: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Update admin permissions to include success stories
const updateAdminPermissions = async () => {
  try {
    await connectDB();

    console.log("🔄 Updating admin permissions to include success stories...");

    // Find all admins
    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admins to update`);

    for (const admin of admins) {
      let permissionsUpdated = false;

      // Check if admin already has the permission
      if (!admin.permissions.includes("manage_success_stories")) {
        admin.permissions.push("manage_success_stories");
        permissionsUpdated = true;
      }

      // Save if permissions were updated
      if (permissionsUpdated) {
        await admin.save();
        console.log(`✅ Updated permissions for admin: ${admin.username}`);
      } else {
        console.log(`⏭️  Admin ${admin.username} already has success stories permission`);
      }
    }

    console.log("\n🎉 Admin permissions update completed!");
    
    // Display updated permissions for verification
    console.log("\n📋 Updated admin permissions:");
    const updatedAdmins = await Admin.find({}, "username role permissions");
    
    updatedAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.username} (${admin.role}):`);
      console.log(`   Permissions: ${admin.permissions.join(", ")}`);
    });

  } catch (error) {
    console.error("❌ Error updating admin permissions:", error);
  }
};

// Main function
const main = async () => {
  console.log("🚀 Starting admin permissions update...\n");
  await updateAdminPermissions();
  console.log("\n✅ Admin permissions update completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled rejection:", error);
  process.exit(1);
});

// Run the update
main();
