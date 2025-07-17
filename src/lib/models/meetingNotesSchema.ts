import mongoose from 'mongoose';

const meetingNotesSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Meeting Notes'
  },
  content: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  wordCount: {
    type: Number,
    default: 0
  },
  autoSaveCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for faster queries
meetingNotesSchema.index({ meetingId: 1, userId: 1 }, { unique: true });

// Pre-save middleware to update word count
meetingNotesSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.wordCount = this.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    this.lastModified = new Date();
  }
  next();
});

export default mongoose.models.MeetingNotes || mongoose.model('MeetingNotes', meetingNotesSchema);
