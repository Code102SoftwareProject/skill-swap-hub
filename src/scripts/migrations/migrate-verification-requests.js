// migration-script.js
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

// Define old collection schema (for reference)
const OldVerificationRequestSchema = new mongoose.Schema({
  userId: String,
  skillId: mongoose.Types.ObjectId,
  skillName: String,
  status: String,
  documents: [String],
  description: String,
  feedback: String,
  createdAt: Date,
  updatedAt: Date
}, {
  collection: 'verificationrequests'
});

// Define new collection schema
const NewVerificationRequestSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  skillId: { 
    type: mongoose.Types.ObjectId, 
    required: true,
    ref: 'UserSkill'
  },
  skillName: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  documents: [{ type: String }],
  description: { type: String },
  feedback: { type: String },
}, { 
  timestamps: true,
  collection: 'userskillverificationrequests',
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

// Create models
const OldVerificationRequest = mongoose.model('OldVerificationRequest', OldVerificationRequestSchema);
const NewVerificationRequest = mongoose.model('NewVerificationRequest', NewVerificationRequestSchema);

async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // Get count of documents in old collection
    const count = await OldVerificationRequest.countDocuments();
    console.log(`Found ${count} documents to migrate`);
    
    // Get all documents from old collection
    const oldDocuments = await OldVerificationRequest.find({});
    console.log(`Retrieved ${oldDocuments.length} documents from old collection`);
    
    // Initialize counters
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each document
    for (const oldDoc of oldDocuments) {
      try {
        // Create new document with the same data
        const newDoc = new NewVerificationRequest({
          _id: oldDoc._id, // Preserve the original ID
          userId: oldDoc.userId,
          skillId: oldDoc.skillId,
          skillName: oldDoc.skillName,
          status: oldDoc.status,
          documents: oldDoc.documents,
          description: oldDoc.description,
          feedback: oldDoc.feedback,
          createdAt: oldDoc.createdAt,
          updatedAt: oldDoc.updatedAt
        });
        
        // Save the new document
        await newDoc.save();
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`Migrated ${successCount} documents...`);
        }
      } catch (err) {
        errorCount++;
        errors.push({
          documentId: oldDoc._id,
          error: err.message
        });
        console.error(`Error migrating document ${oldDoc._id}:`, err.message);
      }
    }
    
    console.log('\nMigration completed:');
    console.log(`Total documents: ${count}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed to migrate: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      console.log(JSON.stringify(errors, null, 2));
    }
    
    // Create the compound index
    await NewVerificationRequest.collection.createIndex(
      { userId: 1, skillId: 1, status: 1 },
      { 
        unique: true,
        partialFilterExpression: { status: "pending" }
      }
    );
    console.log('Created compound index');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
migrateData();