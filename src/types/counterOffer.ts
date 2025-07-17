// Counter offer related types

export interface CounterOffer {
  _id: string;
  originalSessionId: string;
  counterOfferedBy: any; // User object or ID
  skill1Id: any;
  skill2Id: any;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  expectedEndDate?: string;
  counterOfferMessage: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface CounterOfferData {
  originalSessionId: string;
  counterOfferedBy: string;
  skill1Id: string;
  skill2Id: string;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  expectedEndDate?: string;
  counterOfferMessage: string;
}
