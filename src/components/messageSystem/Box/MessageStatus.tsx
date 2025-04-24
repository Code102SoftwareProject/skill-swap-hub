import React from 'react';
import { Check } from 'lucide-react';

interface MessageStatusProps {
  readStatus: boolean;
}

const MessageStatus = ({ readStatus }: MessageStatusProps) => {
  return (
    <div className="flex items-center ml-1">
      <div className="relative">
        <Check 
          size={12} 
          className={`absolute transition-colors duration-300 ${
            readStatus ? 'text-primary' : 'text-gray-400'
          }`}
          style={{ left: '-7px' }}
        />
        <Check 
          size={12} 
          className={`transition-colors duration-300 ${
            readStatus ? 'text-primary' : 'text-gray-400'
          }`}
        />
      </div>
    </div>
  );
};

export default MessageStatus;