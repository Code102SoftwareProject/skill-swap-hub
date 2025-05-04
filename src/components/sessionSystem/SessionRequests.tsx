import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SessionRequestsProps {
  sessions: any[];
  userId: string;
  userProfiles: any;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export default function SessionRequests({ 
  sessions, 
  userId, 
  userProfiles, 
  onAccept, 
  onReject 
}: SessionRequestsProps) {
  if (!sessions || sessions.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Requests</h3>
      <div className="space-y-3">
        {sessions.map(session => {
          const sender = userProfiles[session.user1Id] || { name: 'User', profileImage: '/default-avatar.png' };
          
          return (
            <div key={session._id} className="border rounded-md p-3 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={sender.profileImage} 
                  alt={sender.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{sender.name}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="text-sm">
                <p className="mb-1"><span className="font-medium">They'll teach:</span> {session.skill1Id?.name || 'A skill'}</p>
                <p className="mb-1"><span className="font-medium">You'll teach:</span> {session.skill2Id?.name || 'A skill'}</p>
                <p className="text-gray-700">{session.descriptionOfService1}</p>
                
                <div className="flex items-center text-xs text-gray-600 mt-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  Starting: {new Date(session.startDate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => onReject(session._id)}
                  className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => onAccept(session._id)}
                  className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-blue-700"
                >
                  Accept
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}