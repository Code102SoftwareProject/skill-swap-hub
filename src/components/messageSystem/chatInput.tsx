//component/messageSystem/chatInput.tsx
import React, { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: () => void;
  onPlus?: () => void; // For the plus button functionality
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onAttach, onPlus }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
      {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex items-center border border-secondary rounded-full px-4 py-2 bg-accent shadow-md">
      {/* Plus Button (LHS) */}
      <button
        className="p-2 rounded-full bg-primary text-white hover:opacity-90 mr-2"
        onClick={onPlus}
        aria-label="Add"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Input Field */}
      <div className="flex items-center flex-1 relative">
        <input
          type="text"
          className="flex-1 px-3 py-2 text-sm border-none outline-none text-primary placeholder:text-primary"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Paperclip Icon (Attachment) */}
        <button
          className="absolute right-12 p-2 hover:bg-gray-200 rounded-full"
          onClick={onAttach}
          aria-label="Attach file"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 10.487l-4.95 4.95a3.5 3.5 0 01-4.95-4.95l6.364-6.364a2.5 2.5 0 113.536 3.536l-6.364 6.364a1.5 1.5 0 01-2.122-2.122l4.95-4.95"
            />
          </svg>
        </button>

        {/* Send Button */}
        <button
          className="absolute right-2 p-2 rounded-full bg-primary text-white hover:opacity-90"
          onClick={handleSend}
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M22 12l-20-9 9 9-9 9 20-9z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
