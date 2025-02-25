import mongoose, {Schema , model, models} from 'mongoose';

const badgeSchema = new Schema({
    badgeId: { type: mongoose.Types.ObjectId },
    badgeName: { type: String, required: true, unique: true },
    badgeImage: { type: String, required: true },
    criteria: { type: String, required: true },
    description: { type: String, required: true }
}, { timestamps: true });

const BadgeSchema = models.badge || model('badge', badgeSchema);
 export default BadgeSchema;

