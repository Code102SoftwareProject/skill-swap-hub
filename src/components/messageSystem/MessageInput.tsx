'use client';

import { useState } from 'react';

export default function MessageInput({ chatRoomId, userId }: { chatRoomId: string; userId: string }) {
  const [message, setMessage] = useState('');

  async function sendMessage() {
    if (!message.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatRoomId,
          senderId: userId,
          receiverId: 'receiverId', // Replace with actual receiver ID
          content: message,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('');
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  return (
    <div className="p-4 bg-gray-50 border-t flex items-center space-x-2">
      <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
        📎
      </button>
      <input
        type="text"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-grow p-2 text-sm border rounded-md focus:outline-none"
      />
      <button
        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        onClick={sendMessage}
      >
        Send
      </button>
    </div>
  );
}
