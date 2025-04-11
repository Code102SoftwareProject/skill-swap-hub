// File: src/lib/models/skillList.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillList extends Document {
  categoryId: number;
  categoryName: string;
  skills: string[];
}

const SkillListSchema: Schema = new Schema({
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

// Check if the model already exists to prevent overwriting during hot reloads
const SkillList = mongoose.models.SkillList || mongoose.model<ISkillList>('SkillList', SkillListSchema);

export default SkillList;