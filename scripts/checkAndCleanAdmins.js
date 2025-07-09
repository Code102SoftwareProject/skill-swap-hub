import mongoose from "mongoose";
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

// Check all admin records
const checkAllAdmins = async () => {
  try {
    await connectDB();

    // Get all admin records
    const admins = await mongoose.connection.db
      .collection("admins")
      .find({})
      .toArray();

    console.log(`🔍 Found ${admins.length} admin records:\n`);

    admins.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`- ID: ${admin._id}`);
      console.log(`- Username: ${admin.username}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Role: ${admin.role}`);
      console.log(`- Status: ${admin.status}`);
      console.log(
        `- Permissions: ${JSON.stringify(admin.permissions, null, 2)}`
      );
      console.log(`- Created: ${admin.createdAt}`);
      console.log(`- Updated: ${admin.updatedAt}`);
      console.log("---");
    });

    // Clean up - remove all and recreate properly
    console.log("🧹 Cleaning all admin records...");
    await mongoose.connection.db.collection("admins").deleteMany({});
    console.log("✅ All admin records removed");
  } catch (error) {
    console.error("❌ Error checking admins:", error);
  }
};

// Main function
const main = async () => {
  console.log("🔍 Checking all admin records...\n");
  await checkAllAdmins();
  console.log("\n✅ Check completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

// Run the script
main();
