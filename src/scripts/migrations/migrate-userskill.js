import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define the schema with explicit collection name 'userskills'
const UserSkillSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  categoryId: {
    type: Number,
    required: true
  },
  categoryName: {
    type: String,
    required: true
  },
  skillTitle: {
    type: String,
    required: true
  },
  proficiencyLevel: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Expert']
  },
  description: {
    type: String,
    required: true,
    minlength: 10
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerificationRequest',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'userskills', // Explicitly set the collection name
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Create model with explicit collection name
const UserSkill = mongoose.model('UserSkill', UserSkillSchema, 'userskills');

async function migrateUserSkills() {
  try {
    console.log('Starting UserSkill migration for "userskills" collection...');
    
    // Get count of documents
    const count = await UserSkill.countDocuments();
    console.log(`Found ${count} documents in "userskills" collection to process`);
    
    // Check for and update any documents that might need fixing
    console.log('Validating documents in "userskills" collection...');
    
    // Drop existing indexes to ensure clean recreation
    try {
      await UserSkill.collection.dropIndexes();
      console.log('Dropped all existing indexes on "userskills" collection');
    } catch (err) {
      console.log('Error dropping indexes:', err.message);
    }
    
    // Create the necessary indexes
    console.log('Creating indexes for "userskills" collection...');
    
    // Create single index on userId
    await UserSkill.collection.createIndex(
      { userId: 1 },
      { name: 'userId_index' }
    );
    console.log('Created index on userId field');
    
    // Create compound unique index
    await UserSkill.collection.createIndex(
      { userId: 1, skillTitle: 1 }, 
      { unique: true, name: 'userId_skillTitle_unique' }
    );
    console.log('Created unique compound index for userId and skillTitle');
    
    // Optional: Perform data validation/cleanup if needed
    const batchSize = 100;
    let processedCount = 0;
    
    for (let skip = 0; skip < count; skip += batchSize) {
      const batch = await UserSkill.find({}).skip(skip).limit(batchSize);
      
      for (const doc of batch) {
        // Data validation - ensure required fields exist and have proper values
        let needsUpdate = false;
        
        // Example of a data cleanup operation - ensure description meets minimum length
        if (doc.description && doc.description.length < 10) {
          doc.description = doc.description.padEnd(10, ' ');
          needsUpdate = true;
        }
        
        // Ensure proficiencyLevel is valid enum value
        if (doc.proficiencyLevel && !['Beginner', 'Intermediate', 'Expert'].includes(doc.proficiencyLevel)) {
          doc.proficiencyLevel = 'Beginner'; // Default to beginner if invalid
          needsUpdate = true;
        }
        
        // Save if updates needed
        if (needsUpdate) {
          await doc.save();
        }
        
        processedCount++;
        if (processedCount % 100 === 0 || processedCount === count) {
          console.log(`Processed ${processedCount}/${count} documents...`);
        }
      }
    }
    
    console.log(`Migration for "userskills" collection completed successfully`);
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
migrateUserSkills().catch(console.error);