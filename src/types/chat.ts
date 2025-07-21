export interface IMessage {
    _id?: string;
    chatRoomId: string;
    senderId: string;
    content: string;
    sentAt?: number;
    type?: "text" | "file"; 
    replyFor?: string | { _id?: string; senderId?: string; content?: string }; // Can be ID string or full message object
    replyForSender?: string; 
    replyForContent?: string; 
    readStatus: boolean;
    userId?: string; 
    messageIds?: string[]; 
    fileUrl?: string; 
    fileName?: string; 
    deliveryStatus?: 'sent' | 'delivered' | 'read';
}

export interface IChatRoom {
    _id: string;
    participants: string[];
    createdAt: string;
    lastMessage?: {
      content: string;
      sentAt: number;
      senderId: string;
    };
}
