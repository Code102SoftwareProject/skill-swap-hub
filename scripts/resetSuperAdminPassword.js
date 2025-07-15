import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/skillSwapHub",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Reset super admin password
const resetSuperAdminPassword = async () => {
  try {
    await connectDB();

    // New password
    const newPassword = "NewSuperAdmin123!";

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the super admin password
    const result = await Admin.updateOne(
      { username: "superadmin" },
      { password: hashedPassword }
    );

    if (result.modifiedCount > 0) {
      console.log("✅ Super admin password reset successfully!");
      console.log("📋 New credentials:");
      console.log("   Username: superadmin");
      console.log("   Password:", newPassword);
      console.log("");
      console.log("⚠️  Please save these credentials securely!");
    } else {
      console.log("❌ Failed to reset password. Super admin might not exist.");
    }
  } catch (error) {
    console.error("❌ Error resetting password:", error);
  }
};

// Main function
const main = async () => {
  console.log("🔄 Resetting super admin password...\n");
  await resetSuperAdminPassword();
  console.log("\n✅ Password reset completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

// Run the script
main();
