
import mongoose, { Document } from 'mongoose';
import { SearchService } from '@/app/services/SearchService';

// Interface for Forum document
export interface IForum extends Document {
  title: string;
  description: string;
  posts: number;
  replies: number;
  lastActive: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const forumSchema = new mongoose.Schema<IForum>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  posts: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  lastActive: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Add hooks for Elasticsearch synchronization
forumSchema.post('save', async function(doc) {
  const searchService = SearchService.getInstance();
  await searchService.syncDocument(doc as IForum & { _id: mongoose.Types.ObjectId }, 'index');
});

forumSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  const searchService = SearchService.getInstance();
  await searchService.syncDocument(doc as IForum & { _id: mongoose.Types.ObjectId }, 'delete');
});

// Add hooks for update operations
forumSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    const searchService = SearchService.getInstance();
    await searchService.syncDocument(doc as IForum & { _id: mongoose.Types.ObjectId }, 'index');
  }
});

forumSchema.post('updateOne', async function(doc) {
  const conditions = this.getFilter();
  if (conditions._id) {
    const updatedDoc = await this.model.findOne(conditions);
    if (updatedDoc) {
      const searchService = SearchService.getInstance();
      await searchService.syncDocument(updatedDoc as IForum & { _id: mongoose.Types.ObjectId }, 'index');
    }
  }
});

// Create and export the model
export const Forum = mongoose.models.Forum || mongoose.model<IForum>('Forum', forumSchema);