import mongoose from "mongoose";
import bcrypt from "bcryptjs";
// Note: We'll need to define the schema here since we can't import TS files directly
// import Admin from "../src/lib/models/adminSchema.js";

// Define the Admin schema for the setup script
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
    if (this.role === "super_admin") {
      this.permissions = [
        "manage_admins",
        "manage_users",
        "manage_kyc",
        "manage_suggestions",
        "manage_system",
        "manage_verification",
        "manage_reporting",
        "view_dashboard",
      ];
    } else {
      this.permissions = [
        "manage_users",
        "manage_kyc",
        "manage_suggestions",
        "manage_verification",
        "view_dashboard",
      ];
    }
  }
  next();
});

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

// Create the first super admin
const createFirstSuperAdmin = async () => {
  try {
    // Check if any super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: "super_admin" });

    if (existingSuperAdmin) {
      console.log("Super admin already exists:", existingSuperAdmin.username);
      return;
    }

    // Super admin credentials (change these!)
    const superAdminData = {
      username: "superadmin",
      email: "superadmin@skillswaphub.com",
      password: "SuperAdmin123!", // Change this to a secure password
      role: "super_admin",
      permissions: [
        "manage_admins",
        "manage_users",
        "manage_kyc",
        "manage_suggestions",
        "manage_system",
        "manage_verification",
        "manage_reporting",
        "view_dashboard",
      ],
      status: "active",
      createdBy: null, // Super admin is not created by anyone
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

    console.log("Super admin created successfully!");
    console.log("Username:", superAdminData.username);
    console.log("Email:", superAdminData.email);
    console.log("Password:", superAdminData.password);
    console.log("Role:", superAdminData.role);
    console.log("");
    console.log(
      "⚠️  IMPORTANT: Change the default password after first login!"
    );
    console.log(
      "⚠️  Store these credentials securely and delete this script output!"
    );
  } catch (error) {
    console.error("Error creating super admin:", error);
  }
};

// Update existing admins to have the new role structure
const updateExistingAdmins = async () => {
  try {
    // Find admins without a role (old schema)
    const adminsWithoutRole = await Admin.find({ role: { $exists: false } });

    if (adminsWithoutRole.length > 0) {
      console.log(
        `Found ${adminsWithoutRole.length} admins without role. Updating...`
      );

      // Update all existing admins to have 'admin' role and default permissions
      await Admin.updateMany(
        { role: { $exists: false } },
        {
          $set: {
            role: "admin",
            permissions: [
              "manage_users",
              "manage_kyc",
              "manage_suggestions",
              "manage_verification",
              "view_dashboard",
            ],
            status: "active",
            createdBy: null,
          },
        }
      );

      console.log("Updated existing admins with new role structure");
    }
  } catch (error) {
    console.error("Error updating existing admins:", error);
  }
};

// Main function
const main = async () => {
  console.log("Setting up admin hierarchy...");

  await connectDB();
  await updateExistingAdmins();
  await createFirstSuperAdmin();

  console.log("Admin hierarchy setup completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

// Run the script
main();
