export interface IMessage {
    _id?: string;
    chatRoomId: string;
    senderId: string;
    content: string;
    sentAt?: number;
    type?: "text" | "file" | "read_receipt"; // Add this property for message types
    replyFor?: string; // This should be the ID of the message being replied to, not the IMessage object
    replyForSender?: string; // Add this for showing who sent the original message
    replyForContent?: string; // Add this for showing content preview of original message
    readStatus: boolean;
    userId?: string; // Add this for handling read receipts
    messageIds?: string[]; // For batch message operations
    fileUrl?: string; // For file messages
    fileName?: string; // For file messages
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
