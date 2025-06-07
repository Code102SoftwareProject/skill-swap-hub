"use client";

import React from "react";
import MessageStatusIndicator from "../MessageStatusIndicator";

interface TextMessageProps {
  content: string;
  sentAt?: string | Date;
  isMine?: boolean;
  deliveryStatus?: 'sent' | 'delivered' | 'read';
}

/**
 * TextMessage component
 * @param content - The text content of the message
 * @param sentAt - Timestamp when message was sent
 * @param isMine - Whether the message belongs to current user
 * @param deliveryStatus - Message delivery status (sent/delivered/read)
 * @description A component to display regular text messages with timestamp and delivery status
 */
const TextMessage = ({ content, sentAt, isMine = false, deliveryStatus }: TextMessageProps) => {  return (
    
    <div className="flex flex-col">
      {/* Message bubble */}
      <span className="block font-body">{content}</span>
      
      {/* Timestamp and delivery status */}
      <div className="flex justify-end items-center mt-1 gap-1">
        <div className={`text-xs text-[10px] ${isMine ? "text-black/80" : "text-gray-500"}`}>
          {sentAt
            ? new Date(sentAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </div>
        
        {/* Message status indicator */}
        <MessageStatusIndicator 
          deliveryStatus={deliveryStatus} 
          isMine={isMine} 
        />
      </div>
    </div>
  );
};

export default TextMessage;