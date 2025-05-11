export interface IMessage {
    _id?: string;
    chatRoomId: string;
    senderId: string;
    content: string;
    sentAt?: number;
    type?: "text" | "file"; 
    replyFor?: string; 
    replyForSender?: string; 
    replyForContent?: string; 
    readStatus: boolean;
    userId?: string; 
    messageIds?: string[]; 
    fileUrl?: string; 
    fileName?: string; 
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
