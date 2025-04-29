import mongoose, {Schema , model, models} from 'mongoose';

// Define schema structure for badge documents
const badgeSchema = new Schema({
    //MongoDB ObjectId (typically auto-generated)
    badgeId: { type: mongoose.Types.ObjectId },
    badgeName: { type: String, required: true, unique: true }, // Unique name for the badge
    badgeImage: { type: String, required: true }, // URL or path to the badge image
    criteria: { type: String, required: true },
    description: { type: String, required: true }
}, { timestamps: true }); // Add createdAt and updatedAt fields automatically

const BadgeSchema = models.badge || model('badge', badgeSchema);
 export default BadgeSchema;

