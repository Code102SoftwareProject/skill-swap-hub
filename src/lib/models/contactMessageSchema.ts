import mongoose, { Schema, Document, models } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  submittedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['unread', 'read', 'archived'], default: 'unread' },
  submittedAt: { type: Date, default: Date.now },
});

const ContactMessage = models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);
export default ContactMessage; 