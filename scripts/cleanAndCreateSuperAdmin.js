import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    // Load environment variables
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

// Clean and recreate admin collection
const cleanAndCreateSuperAdmin = async () => {
  try {
    await connectDB();

    console.log("🧹 Cleaning up old admin collection...");

    // Drop the admin collection to start fresh
    try {
      await mongoose.connection.db.collection("admins").drop();
      console.log("✅ Old admin collection dropped");
    } catch (error) {
      console.log("ℹ️  Admin collection doesn't exist or already empty");
    }

    // Define the correct Admin schema
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

    console.log("🔐 Creating new super admin...");

    // Super admin credentials
    const superAdminData = {
      username: "superadmin",
      email: "superadmin@skillswaphub.com",
      password: "SuperAdmin123!",
      role: "super_admin",
      status: "active",
      createdBy: null,
    };

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      superAdminData.password,
      saltRounds
    );

    // Create the super admin
    const superAdmin = new Admin({
      ...superAdminData,
      password: hashedPassword,
    });

    await superAdmin.save();

    console.log("✅ Super admin created successfully!");
    console.log("📋 Credentials:");
    console.log("   Username:", superAdminData.username);
    console.log("   Email:", superAdminData.email);
    console.log("   Password:", superAdminData.password);
    console.log("   Role:", superAdminData.role);
    console.log("");
    console.log(
      "⚠️  IMPORTANT: Change the default password after first login!"
    );

    // Verify the admin was created
    const createdAdmin = await Admin.findOne(
      { username: "superadmin" },
      "-password"
    );
    console.log("🔍 Verification - Created admin:", createdAdmin);
  } catch (error) {
    console.error("❌ Error cleaning and creating super admin:", error);
  }
};

// Main function
const main = async () => {
  console.log("🔄 Cleaning admin collection and creating super admin...\n");
  await cleanAndCreateSuperAdmin();
  console.log("\n✅ Process completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

// Run the script
main();
