import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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

// Pre-save middleware to set default permissions based on role
adminSchema.pre("save", function (next) {
  if (this.permissions.length === 0) {
    // Base permissions that all admins have
    const baseAdminPermissions = [
      "manage_users",
      "manage_kyc",
      "manage_suggestions",
      "manage_verification",
      "manage_reporting",
      "manage_system",
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

// Ensure we create a new model
delete mongoose.models.Admin;
const Admin = mongoose.model("Admin", adminSchema);

// Test permission structure
const testPermissions = async () => {
  try {
    await connectDB();

    console.log("🔍 Testing permission structure...\n");

    // Check existing super admin
    const superAdmin = await Admin.findOne({ role: "super_admin" });
    if (superAdmin) {
      console.log("✅ Super Admin found:");
      console.log("- Username:", superAdmin.username);
      console.log("- Role:", superAdmin.role);
      console.log("- Permissions:", superAdmin.permissions);
      console.log(
        "- Can manage admins:",
        superAdmin.permissions.includes("manage_admins") ? "✅ YES" : "❌ NO"
      );
      console.log("");
    }

    // Create a test normal admin to verify permissions
    const testAdminData = {
      username: "testadmin",
      email: "testadmin@skillswaphub.com",
      password: "TestAdmin123!",
      role: "admin",
      status: "active",
    };

    // Delete existing test admin if it exists
    await Admin.deleteOne({ username: testAdminData.username });

    // Hash password
    const hashedPassword = await bcrypt.hash(testAdminData.password, 12);

    // Create test admin
    const testAdmin = new Admin({
      ...testAdminData,
      password: hashedPassword,
    });

    await testAdmin.save();

    console.log("✅ Test Normal Admin created:");
    console.log("- Username:", testAdmin.username);
    console.log("- Role:", testAdmin.role);
    console.log("- Permissions:", testAdmin.permissions);
    console.log(
      "- Can manage admins:",
      testAdmin.permissions.includes("manage_admins") ? "✅ YES" : "❌ NO"
    );
    console.log("");

    // Compare permissions
    console.log("📊 Permission Comparison:");
    console.log(
      "Super Admin permissions:",
      superAdmin?.permissions?.length || 0
    );
    console.log("Normal Admin permissions:", testAdmin.permissions.length);
    console.log("");

    const superAdminOnlyPermissions =
      superAdmin?.permissions?.filter(
        (p) => !testAdmin.permissions.includes(p)
      ) || [];
    const commonPermissions = testAdmin.permissions.filter((p) =>
      superAdmin?.permissions?.includes(p)
    );

    console.log("🔐 Super Admin Only permissions:", superAdminOnlyPermissions);
    console.log("🤝 Common permissions:", commonPermissions);

    // Clean up test admin
    await Admin.deleteOne({ username: testAdminData.username });
    console.log("\n🧹 Test admin cleaned up");
  } catch (error) {
    console.error("❌ Error testing permissions:", error);
  }
};

// Main function
const main = async () => {
  console.log("🧪 Testing permission structure...\n");
  await testPermissions();
  console.log("\n✅ Test completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

// Run the script
main();
