"use client";

import React from "react";
import { Check, CheckCheck } from "lucide-react";

interface MessageStatusIndicatorProps {
  deliveryStatus?: 'sent' | 'delivered' | 'read';
  isMine: boolean;
}

/**
 * MessageStatusIndicator Component
 * Shows delivery status for sent messages:
 * - Single ✓: Message sent (recipient offline)
 * - Double ✓✓: Message delivered (recipient online)
 * - Double ✓✓ (blue): Message read (recipient viewed chat)
 */
export default function MessageStatusIndicator({ 
  deliveryStatus = 'sent', 
  isMine 
}: MessageStatusIndicatorProps) {
  // Only show status indicators for messages sent by current user
  if (!isMine) return null;

  const getStatusIcon = () => {
    switch (deliveryStatus) {
      case 'sent':
        return (
          <Check 
            size={14} 
            className="text-gray-400" 
            strokeWidth={2}
          />
        );
      
      case 'delivered':
        return (
          <CheckCheck 
            size={14} 
            className="text-gray-400" 
            strokeWidth={2}
          />
        );
      
      case 'read':
        return (
          <CheckCheck 
            size={14} 
            className="text-blue-500" 
            strokeWidth={2}
          />
        );
      
      default:
        return (
          <Check 
            size={14} 
            className="text-gray-400" 
            strokeWidth={2}
          />
        );
    }
  };

  return (
    <div className="flex items-center justify-end mt-1">
      {getStatusIcon()}
    </div>
  );
}
