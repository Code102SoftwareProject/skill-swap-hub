import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
export interface ISkill {
  skillId: string;
  name: string;
}

export interface ISkillList extends Document {
  categoryId: number;
  categoryName: string;
  skills: ISkill[];
}

// Skill sub-schema
const SkillSchema = new Schema<ISkill>({
  skillId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

// Main SkillList schema
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
    type: [SkillSchema],
    required: true,
    default: []
  }
}, { collection: 'skillLists' });

// Ensure global uniqueness by regenerating duplicates
SkillListSchema.pre('save', async function (next) {
  const skillList = this as unknown as  ISkillList;

  const regenerateDuplicates = async () => {
    const allSkillIds = skillList.skills.map(s => s.skillId || uuidv4());

    const duplicateSkillIds = new Set();
    const checkedIds = new Set();

    // Loop to regenerate until no duplicates remain
    for (let i = 0; i < skillList.skills.length; i++) {
      let skill = skillList.skills[i];

      // Assign ID if missing
      if (!skill.skillId) {
        skill.skillId = uuidv4();
      }

      let safe = false;
      while (!safe) {
        const exists = await mongoose.models.SkillList.findOne({
          _id: { $ne: skillList._id },
          'skills.skillId': skill.skillId
        });

        if (exists || checkedIds.has(skill.skillId)) {
          // Conflict: generate new ID
          skill.skillId = uuidv4();
        } else {
          // Safe to use
          safe = true;
          checkedIds.add(skill.skillId);
        }
      }
    }
  };

  await regenerateDuplicates();
  next();
});

// Final model
const SkillList = mongoose.models.SkillList || mongoose.model<ISkillList>('SkillList', SkillListSchema);
export default SkillList;
