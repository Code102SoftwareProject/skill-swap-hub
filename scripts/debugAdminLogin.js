import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define the Admin schema for debugging
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
    // Load environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Debug admin credentials
const debugAdminCredentials = async () => {
  try {
    await connectDB();

    // Find the super admin
    const superAdmin = await Admin.findOne({ username: "superadmin" });

    if (!superAdmin) {
      console.log("❌ Super admin not found!");
      return;
    }

    console.log("✅ Super admin found:");
    console.log("- ID:", superAdmin._id);
    console.log("- Username:", superAdmin.username);
    console.log("- Email:", superAdmin.email);
    console.log("- Role:", superAdmin.role);
    console.log("- Status:", superAdmin.status);
    console.log("- Permissions:", superAdmin.permissions);
    console.log("- Created:", superAdmin.createdAt);

    // Test password verification
    const testPassword = "SuperAdmin123!";
    console.log("\n🔐 Testing password verification:");
    console.log("- Test password:", testPassword);
    console.log("- Stored hash:", superAdmin.password);

    const isPasswordValid = await bcrypt.compare(
      testPassword,
      superAdmin.password
    );
    console.log("- Password valid:", isPasswordValid ? "✅ YES" : "❌ NO");

    // Test different possible passwords
    const possiblePasswords = [
      "SuperAdmin123!",
      "superadmin",
      "admin",
      "password",
      "123456",
    ];

    console.log("\n🔍 Testing common passwords:");
    for (const pwd of possiblePasswords) {
      const isValid = await bcrypt.compare(pwd, superAdmin.password);
      console.log(`- "${pwd}": ${isValid ? "✅ VALID" : "❌ Invalid"}`);
    }
  } catch (error) {
    console.error("Error debugging credentials:", error);
  }
};

// Main function
const main = async () => {
  console.log("🔍 Debugging admin credentials...\n");
  await debugAdminCredentials();
  console.log("\n✅ Debug completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

// Run the script
main();
