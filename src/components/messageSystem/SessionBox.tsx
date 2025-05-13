import React from 'react';

interface SessionBoxProps {

}

const SessionBox: React.FC<SessionBoxProps> = () => {
  return (
    <div className="flex items-center justify-center p-8 m-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-500">Session Feature</h3>
        <p className="mt-2 text-gray-400">This feature is yet to be implemented</p>
      </div>
    </div>
  );
};

export default SessionBox;