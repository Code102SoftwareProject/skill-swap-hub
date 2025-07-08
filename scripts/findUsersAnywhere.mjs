import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

const client = new MongoClient(uri);

async function findUsersAnywhere() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    // First, check the skillSwapHub database specifically
    const database = client.db("skillSwapHub");
    const collections = await database.listCollections().toArray();

    console.log("�️ Collections in skillSwapHub database:");
    for (const collection of collections) {
      console.log(`  📄 ${collection.name}`);

      const coll = database.collection(collection.name);
      const count = await coll.countDocuments();
      console.log(`    📊 Documents: ${count}`);

      if (count > 0) {
        const sampleDoc = await coll.findOne({});
        // Check if it looks like a user document
        const hasUserFields =
          sampleDoc.email ||
          sampleDoc.username ||
          sampleDoc.name ||
          sampleDoc.firstName;
        if (hasUserFields) {
          console.log(`    🎯 POTENTIAL USER COLLECTION: ${collection.name}`);
          console.log(
            `    📝 Sample document:`,
            JSON.stringify(sampleDoc, null, 2)
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

findUsersAnywhere();
