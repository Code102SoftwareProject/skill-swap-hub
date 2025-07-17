import { ObjectId } from "mongoose";

export interface Session {
  _id: string;
  user1Id: any;
  user2Id: any;
  skill1Id: any;
  skill2Id: any;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  expectedEndDate?: string;
  isAccepted: boolean | null;
  status: "active" | "completed" | "canceled" | "pending" | "rejected" | string;
  progress1?: any;
  progress2?: any;
  completionApprovedAt?: string;
  completionRequestedAt?: string;
  completionRequestedBy?: any;
  completionApprovedBy?: any;
  completionRejectedBy?: any;
  completionRejectedAt?: string;
  completionRejectionReason?: string;
  rejectedBy?: any;
  rejectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for backwards compatibility
  isAmmended?: boolean;
}

// Enhanced session interface for detailed view
export interface DetailedSession {
  _id: string;
  user1Id: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  user2Id: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  skill1Id: {
    _id: string;
    name: string;
    level: number;
  };
  skill2Id: {
    _id: string;
    name: string;
    level: number;
  };
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  expectedEndDate?: string;
  isAccepted: boolean;
  status: "active" | "completed" | "canceled";
  progress1?: {
    _id: string;
    userId: string;
    sessionId: string;
    completionPercentage: number;
    status: "not_started" | "in_progress" | "completed" | "abandoned";
    notes: string;
    startDate?: string;
    dueDate?: string;
  };
  progress2?: {
    _id: string;
    userId: string;
    sessionId: string;
    completionPercentage: number;
    status: "not_started" | "in_progress" | "completed" | "abandoned";
    notes: string;
    startDate?: string;
    dueDate?: string;
  };
  completionApprovedAt?: string;
  completionRequestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default Session;