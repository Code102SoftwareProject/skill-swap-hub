import mongoose, { Document, Schema } from 'mongoose';

interface ISuggestion extends Document {
  title: string;
  description: string;
  category: string;
  status: string;
  userId: mongoose.Types.ObjectId; // Link to user
  date: Date;
  isHidden?: boolean;
}

const SuggestionSchema = new Schema<ISuggestion>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  isHidden: { type: Boolean, default: false },
});

const Suggestion = mongoose.models.Suggestion || mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);

export default Suggestion;
