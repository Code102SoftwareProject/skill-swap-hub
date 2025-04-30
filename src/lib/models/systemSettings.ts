import mongoose, { Schema } from "mongoose";

export interface SystemSettings {
  maintenanceMode: boolean;
  message: string;
  until: Date | null;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<SystemSettings>(
  {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default:
        "The site is currently undergoing maintenance. Please check back later.",
    },
    until: {
      type: Date,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Delete _id and __v from the response
SystemSettingsSchema.set("toJSON", {
  transform: (_, returnObject) => {
    delete returnObject._id;
    delete returnObject.__v;
    return returnObject;
  },
});

// Update the updatedAt field before saving
SystemSettingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const SystemSettingsModel =
  mongoose.models.SystemSettings ||
  mongoose.model<SystemSettings>("SystemSettings", SystemSettingsSchema);
