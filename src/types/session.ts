import { ObjectId } from "mongoose";

interface Session {
  _id: string;
  user1Id: string;
  skill1Id: {
    _id: string;
    name: string;
    level: number;
  };
  descriptionOfService1: string;
  user2Id: string;
  skill2Id: {
    _id: string;
    name: string;
    level: number;
  };
  descriptionOfService2: string;
  startDate: string;
  isAccepted: boolean | null;
  isAmmended: boolean;
  status: "active" | "completed" | "canceled";
  createdAt: string;
  updatedAt: string;
  progress1: {
    _id: string;
    userId: string;
    sessionId: string;
    completionPercentage: number;
    status: "not_started" | "in_progress" | "completed" | "abandoned";
    notes: string;
    startDate?: string;
    dueDate?: string;
  };
  progress2: {
    _id: string;
    userId: string;
    sessionId: string;
    completionPercentage: number;
    status: "not_started" | "in_progress" | "completed" | "abandoned";
    notes: string;
    startDate?: string;
    dueDate?: string;
  };
}

export default Session;