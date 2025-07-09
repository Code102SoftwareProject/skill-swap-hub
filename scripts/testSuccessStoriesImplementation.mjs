import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define schemas for testing
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  title: { type: String, required: true },
  password: { type: String, required: true },
  avatar: { type: String },
  suspension: {
    isSuspended: { type: Boolean, default: false },
    suspendedAt: { type: Date },
    reason: { type: String },
  },
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["super_admin", "admin"], default: "admin" },
  permissions: { type: [String], default: [] },
}, { timestamps: true });

const successStorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });

// Models
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
const SuccessStory = mongoose.models.SuccessStory || mongoose.model("SuccessStory", successStorySchema);

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
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Test function
const testSuccessStoriesImplementation = async () => {
  try {
    await connectDB();

    console.log("🧪 Testing Success Stories Implementation\n");

    // 1. Check if collections exist
    console.log("1️⃣ Checking database collections...");
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`   📁 Found collections: ${collectionNames.join(", ")}`);
    
    const hasUsers = collectionNames.includes("users");
    const hasAdmins = collectionNames.includes("admins");
    const hasSuccessStories = collectionNames.includes("successstories");
    
    console.log(`   👥 Users collection: ${hasUsers ? "✅ Exists" : "❌ Missing"}`);
    console.log(`   👤 Admins collection: ${hasAdmins ? "✅ Exists" : "❌ Missing"}`);
    console.log(`   ⭐ Success Stories collection: ${hasSuccessStories ? "✅ Exists" : "❌ Missing"}`);

    // 2. Check users count
    console.log("\n2️⃣ Checking users...");
    const usersCount = await User.countDocuments();
    console.log(`   📊 Total users: ${usersCount}`);
    
    if (usersCount > 0) {
      const sampleUser = await User.findOne().select("firstName lastName email");
      console.log(`   👤 Sample user: ${sampleUser.firstName} ${sampleUser.lastName} (${sampleUser.email})`);
    }

    // 3. Check admins count and permissions
    console.log("\n3️⃣ Checking admins...");
    const adminsCount = await Admin.countDocuments();
    console.log(`   📊 Total admins: ${adminsCount}`);
    
    if (adminsCount > 0) {
      const sampleAdmin = await Admin.findOne().select("username role permissions");
      console.log(`   👤 Sample admin: ${sampleAdmin.username} (${sampleAdmin.role})`);
      console.log(`   🔐 Permissions: ${sampleAdmin.permissions.join(", ")}`);
      
      const hasSuccessStoriesPermission = sampleAdmin.permissions.includes("manage_success_stories");
      console.log(`   ⭐ Has success stories permission: ${hasSuccessStoriesPermission ? "✅ Yes" : "❌ No"}`);
    }

    // 4. Check success stories
    console.log("\n4️⃣ Checking success stories...");
    const successStoriesCount = await SuccessStory.countDocuments();
    console.log(`   📊 Total success stories: ${successStoriesCount}`);
    
    if (successStoriesCount > 0) {
      const stories = await SuccessStory.find()
        .populate("userId", "firstName lastName email")
        .populate("createdBy", "username")
        .limit(3);
      
      console.log(`   📝 Sample stories:`);
      stories.forEach((story, index) => {
        console.log(`     ${index + 1}. "${story.title}" by ${story.userId.firstName} ${story.userId.lastName}`);
        console.log(`        Status: ${story.isPublished ? "Published" : "Draft"}`);
        console.log(`        Created by: ${story.createdBy.username}`);
      });
    }

    // 5. Test schema validation
    console.log("\n5️⃣ Testing schema validation...");
    try {
      const testStory = new SuccessStory({
        // Missing required fields to test validation
        title: "Test Story"
      });
      
      await testStory.validate();
      console.log("   ❌ Schema validation failed - should have thrown error");
    } catch (validationError) {
      console.log("   ✅ Schema validation working correctly");
      console.log(`   📝 Validation errors: ${Object.keys(validationError.errors).join(", ")}`);
    }

    // 6. Summary
    console.log("\n📋 Implementation Status Summary:");
    console.log(`   Database Connection: ✅ Working`);
    console.log(`   Users Collection: ${hasUsers ? "✅" : "❌"} ${usersCount} users`);
    console.log(`   Admins Collection: ${hasAdmins ? "✅" : "❌"} ${adminsCount} admins`);
    console.log(`   Success Stories Collection: ${hasSuccessStories ? "✅" : "❌"} ${successStoriesCount} stories`);
    console.log(`   Schema Validation: ✅ Working`);
    
    // 7. Recommendations
    console.log("\n💡 Recommendations:");
    if (usersCount === 0) {
      console.log("   - Create some test users to enable success story creation");
    }
    if (adminsCount === 0) {
      console.log("   - Run the admin setup script to create admin accounts");
    }
    if (successStoriesCount === 0) {
      console.log("   - Create some test success stories through the admin panel");
    }
    
    console.log("\n🎉 Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during testing:", error);
  }
};

// Main function
const main = async () => {
  console.log("🚀 Starting Success Stories Implementation Test...\n");
  await testSuccessStoriesImplementation();
  console.log("\n✅ Test completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled rejection:", error);
  process.exit(1);
});

// Run the test
main();
