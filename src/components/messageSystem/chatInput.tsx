import React, { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onAttach }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
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
    <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-md">
      {/* Attach Button */}
      <button
        className="p-2 hover:bg-gray-100 rounded-full"
        onClick={onAttach}
        aria-label="Attach file"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-primary"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 12l8.485 8.485a4 4 0 01-5.657 5.657l-9.192-9.193a4 4 0 115.657-5.657L17.657 12"
          />
        </svg>
      </button>

      {/* Input Field */}
      <input
        type="text"
        className="flex-1 px-3 py-2 text-sm border-none outline-none"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {/* Send Button */}
      <button
        className="p-2 hover:bg-gray-100 rounded-full"
        onClick={handleSend}
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-primary"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M22 12l-20-9 9 9-9 9 20-9z"
          />
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;
