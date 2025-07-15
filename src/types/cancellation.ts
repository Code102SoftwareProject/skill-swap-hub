// Cancellation-related types

export interface CancelRequest {
  _id: string;
  sessionId: string;
  initiatorId: any; // User object or ID (changed from requestedBy to match code usage)
  requestedBy?: any; // Keep for backwards compatibility
  reason: string;
  description: string;
  files: string[];
  evidenceFiles?: string[]; // Alternative naming
  status: 'pending' | 'agreed' | 'disputed' | 'finalized';
  
  // Response from other user
  respondedBy?: any;
  responseType?: 'agree' | 'dispute';
  responseDescription?: string;
  responseFiles?: string[];
  responseEvidenceFiles?: string[]; // Alternative naming
  workCompletionPercentage?: number;
  respondedAt?: string;
  
  // Final admin decision or automatic resolution
  finalNote?: string;
  finalizedBy?: any;
  finalizedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CancelRequestData {
  sessionId: string;
  initiatorId: string; // Changed from requestedBy to match interface
  requestedBy?: string; // Keep for backwards compatibility
  reason: string;
  description: string;
  files?: string[];
  evidenceFiles?: string[]; // Alternative naming
}

export interface CancelResponseData {
  cancelRequestId: string;
  respondedBy: string;
  responseType: 'agree' | 'dispute';
  responseDescription?: string;
  responseFiles?: string[];
  workCompletionPercentage?: number;
}
