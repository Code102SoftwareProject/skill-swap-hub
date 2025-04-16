import React from 'react';
interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }
interface ChatMessageProps {
  message: ChatMessage;
}

export default function ChatMessageComponent({ message }: ChatMessageProps) {
  return (
    <div className={`p-4 rounded-lg mb-4 ${
      message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100 mr-auto'
    } max-w-[80%]`}>
      <div className="font-bold mb-1">
        {message.role === 'user' ? 'You' : 'Assistant'}
      </div>
      <div>{message.content}</div>
      <div className="text-xs text-gray-500 mt-2">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}