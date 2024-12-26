import React from "react";

interface MessageProps {
  text: string;
  isSent: boolean;
}

const Message: React.FC<MessageProps> = ({ text, isSent }) => {
  return (
    <div
      className={`message ${isSent ? "sent" : "received"}`}
      style={{
        backgroundColor: isSent ? "#E0F7FA" : "#FFFFFF", // Blue for sent, white for received
        alignSelf: isSent ? "flex-end" : "flex-start", // Right-align sent messages
        padding: "10px",
        borderRadius: "10px",
        maxWidth: "80%",
        margin: "5px 0",
      }}
    >
      {text}
    </div>
  );
};

export default Message;
