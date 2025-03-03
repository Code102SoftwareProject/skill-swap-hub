
export interface IMessage{
    _id?: string;
    chatRoomId: string;
    senderId: string;
    content: string;
    sentAt?: number;
    replyFor?: IMessage | null;
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
  