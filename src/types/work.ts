export interface WorkFile {
  fileName: string;
  fileURL: string;
  fileTitle: string;
  uploadedAt: string;
}

export interface Work {
  _id: string;
  session: string;
  provideUser: any;
  receiveUser: any;
  workURL: string; // Keep for backwards compatibility
  workFiles: WorkFile[]; // New field for multiple files
  workDescription: string;
  provideDate: string;
  acceptanceStatus: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  rating?: number;
  remark?: string;
}

export interface SessionProgress {
  _id: string;
  userId: any; // Can be string or populated user object
  sessionId: string;
  startDate: string;
  dueDate: string;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  notes: string;
}