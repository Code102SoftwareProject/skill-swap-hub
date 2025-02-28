import mongoose, { Document, Schema } from 'mongoose';

interface ISuggestion extends Document {
  title: string;
  description: string;
  category: string;
  status: string;
  userId: string;
}

// Check if model already exists
const Suggestion = mongoose.models.Suggestion || 
  mongoose.model<ISuggestion>(
    'Suggestion',
    new Schema({
      title: { type: String, required: true },
      description: { type: String, required: true },
      category: { type: String, required: true },
      status: { type: String, default: 'Pending' },
      userId: { type: String, required: true }
    })
  );

export default Suggestion;