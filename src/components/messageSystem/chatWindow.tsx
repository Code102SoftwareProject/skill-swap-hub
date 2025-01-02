//component/messageSystem/chatWindow.tsx
import React from "react";
import ChatInput from "./chatInput";
import MessageList from "./sideMessageList";

const sampleMessages = [
  {
    id: 1,
    text: "Hi, how are you?",
    isSent: false,
    name: "Alice",
    date: new Date().toLocaleString(),
  },
  {
    id: 2,
    text: "I'm good, thank you! How about you?",
    isSent: true,
    name: "Bob",
    date: new Date().toLocaleString(),
  },
  {
    id: 3,
    text: "I'm doing well too. Thanks for asking!",
    isSent: false,
    name: "Alice",
    date: new Date().toLocaleString(),
  },
  {
    id: 4,
    text: "Great to hear that! What's new?",
    isSent: true,
    name: "Bob",
    date: new Date().toLocaleString(),
  },
  {
    id: 5,
    text: "Not much, just working on some projects.",
    isSent: false,
    name: "Alice",
    date: new Date().toLocaleString(),
  },
  {
    id: 6,
    text: "Sounds productive! Keep it up.",
    isSent: true,
    name: "Bob",
    date: new Date().toLocaleString(),
  },
];

interface ChatWindowProps {
  activeChatId: string;
  activeChatName: string;  // Add this line
}

const ChatWindow = ({ activeChatId, activeChatName }: ChatWindowProps) => {
  const handleSend = (message: string) => {
    console.log("Message sent:", message);
  };

  const handleAttach = () => {
    console.log("Attachment clicked");
  };

  const handleAdd = () => {
    console.log("Add button clicked");
  };

  return (
    <div className="h-screen w-full border bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Chat with {activeChatName}
          </h2>
          <p className="text-sm text-gray-500">Response time: 1 hour</p>
        </div>
        <div className="flex space-x-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300">
            📞
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300">
            📹
          </button>
        </div>
      </div>

      {/* Messages Container - Flex-grow and scroll */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="flex flex-col">
          {sampleMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 ${msg.isSent ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg shadow-md ${
                  msg.isSent
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input - Fixed at bottom */}
      <div className="border-t bg-white p-3 mt-auto">
        <ChatInput
          onSend={handleSend}
          onAttach={handleAttach}
          onPlus={handleAdd}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
