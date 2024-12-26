// components/messageSystem/MessageList.js
import MessageItem from './messageListItem';

interface Message {
  id: string;
  name: string;
  date: string;
}

interface MessageListProps {
  messages: Message[];
  activeChat: string;
  onSelectChat: (id: string) => void;
}

export default function MessageList({ messages, activeChat, onSelectChat }: MessageListProps) {
  return (
    <div className="w-1/4 h-screen bg-white border-r overflow-y-auto">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          name={message.name}
          date={message.date}
          isActive={activeChat === message.id}
          onClick={() => onSelectChat(message.id)}
        />
      ))}
    </div>
  );
}
