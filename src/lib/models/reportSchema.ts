import mongoose, { Schema, model, models } from 'mongoose';

const reportSchema = new Schema({
  reportId: { type: mongoose.Types.ObjectId },
  title: { type: String, required: true, unique: true },
  generatedDate: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

const ReportSchema = models.report || model("report", reportSchema);
 

export default ReportSchema;
