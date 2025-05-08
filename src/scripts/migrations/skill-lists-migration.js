import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define the old schema (where skills are just strings)
const OldSkillListSchema = new mongoose.Schema({
  categoryId: {
    type: Number,
    required: true,
    unique: true
  },
  categoryName: {
    type: String,
    required: true,
    unique: true
  },
  skills: {
    type: [String],
    required: true,
    default: []
  }
}, { collection: 'skillLists' });

const OldSkillList = mongoose.model('OldSkillList', OldSkillListSchema);

// Define the new schema with skills as objects containing skillId and name
const SkillSchema = new mongoose.Schema({
  skillId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

const NewSkillListSchema = new mongoose.Schema({
  categoryId: {
    type: Number,
    required: true,
    unique: true
  },
  categoryName: {
    type: String,
    required: true,
    unique: true
  },
  skills: {
    type: [SkillSchema],
    required: true,
    default: []
  }
}, { collection: 'skillLists' });

const NewSkillList = mongoose.model('NewSkillList', NewSkillListSchema);

async function migrateSkillLists() {
  try {
    console.log('Starting SkillList migration for "skillLists" collection...');
    
    // Get count of documents
    const count = await OldSkillList.countDocuments();
    console.log(`Found ${count} documents in "skillLists" collection to process`);
    
    // Backup the existing collection by copying to a backup collection
    const oldSkillLists = await OldSkillList.find({});
    console.log('Creating backup of existing data in "skillLists_backup" collection...');
    
    // Create backup collection if it doesn't exist
    await mongoose.connection.db.createCollection('skillLists_backup');
    // Insert all documents into backup collection
    if (oldSkillLists.length > 0) {
      await mongoose.connection.db.collection('skillLists_backup').insertMany(
        oldSkillLists.map(doc => doc.toObject())
      );
      console.log(`Backed up ${oldSkillLists.length} documents to "skillLists_backup"`);
    }
    
    // Process each document and transform to new schema
    console.log('Transforming each document to new schema structure...');
    let processedCount = 0;
    
    for (const oldSkillList of oldSkillLists) {
      // Transform skills from strings to objects with IDs
      const newSkills = oldSkillList.skills.map(skillName => ({
        skillId: uuidv4(), // Generate a unique ID for each skill
        name: skillName
      }));
      
      // Update the document in place with new schema format
      await OldSkillList.updateOne(
        { _id: oldSkillList._id }, 
        { $set: { skills: newSkills } }
      );
      
      processedCount++;
      if (processedCount % 10 === 0 || processedCount === count) {
        console.log(`Processed ${processedCount}/${count} documents...`);
      }
    }
    
    // Drop existing indexes to ensure clean recreation
    try {
      await mongoose.connection.db.collection('skillLists').dropIndexes();
      console.log('Dropped all existing indexes on "skillLists" collection');
    } catch (err) {
      console.log('Error dropping indexes:', err.message);
    }
    
    // Create necessary indexes
    console.log('Creating indexes for "skillLists" collection...');
    
    // Create index on categoryId
    await mongoose.connection.db.collection('skillLists').createIndex(
      { categoryId: 1 },
      { name: 'categoryId_index', unique: true }
    );
    console.log('Created unique index on categoryId field');
    
    // Create index on categoryName
    await mongoose.connection.db.collection('skillLists').createIndex(
      { categoryName: 1 },
      { name: 'categoryName_index', unique: true }
    );
    console.log('Created unique index on categoryName field');
    
    // Create compound index to ensure each skill is unique within a category
    await mongoose.connection.db.collection('skillLists').createIndex(
      { categoryId: 1, 'skills.skillId': 1 },
      { name: 'categoryId_skillId_index', unique: true }
    );
    console.log('Created compound index for categoryId and skills.skillId');
    
    console.log(`Migration for "skillLists" collection completed successfully`);
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
migrateSkillLists().catch(console.error);