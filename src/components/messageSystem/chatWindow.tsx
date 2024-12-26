import React from "react";

const sampleMessages = [
  { id: 1, text: "Hi, how are you?", isSent: false },
  { id: 2, text: "I'm good, thank you! How about you?", isSent: true },
  { id: 3, text: "I'm doing well too. Thanks for asking!", isSent: false },
  { id: 4, text: "Great to hear that! What's new?", isSent: true },
  { id: 5, text: "Not much, just working on some projects.", isSent: false },
  { id: 6, text: "Sounds productive! Keep it up.", isSent: true },
];

interface ChatWindowProps {
  activeChatId: string;
}

const ChatWindow = ({ activeChatId }: ChatWindowProps) => {
  return (
    <div className="flex h-full border rounded-lg shadow-md bg-white">
      {/* Left Sidebar (Messages List) */}
      <div className="w-1/3 border-r bg-gray-100 p-3 overflow-y-auto">
        {sampleMessages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 mb-2 rounded-lg ${
              msg.isSent
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Chat with Joey Nil</h2>
            <p className="text-sm text-gray-500">Response time: 1 hour</p>
          </div>
          <div className="flex space-x-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
              📞
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
              📹
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {sampleMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 ${
                msg.isSent ? "justify-end" : "justify-start"
              }`}
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

        {/* Input */}
        <div className="flex items-center border-t p-3 bg-gray-50">
          <button className="p-2 rounded-full bg-gray-200 mr-3">
            ➕
          </button>
          <input
            type="text"
            placeholder="Type a message"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button className="ml-3 p-2 rounded-full bg-primary text-white">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
