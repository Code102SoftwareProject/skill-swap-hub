import React, { useState } from 'react';
import { Calendar, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface CompletedSessionsProps {
  sessions: any[];
  userId: string;
  userProfiles: any;
}

export default function CompletedSessions({ 
  sessions, 
  userId, 
  userProfiles 
}: CompletedSessionsProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (!sessions || sessions.length === 0) return null;

  const toggleExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };
  
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Completed Sessions</h3>
      <div className="space-y-3">
        {sessions.map(session => {
          const isInitiator = session.user1Id === userId;
          const otherUser = isInitiator 
            ? userProfiles[session.user2Id] || { name: 'User', profileImage: '/default-avatar.png' }
            : userProfiles[session.user1Id] || { name: 'User', profileImage: '/default-avatar.png' };
          
          const mySkill = isInitiator ? session.skill1Id : session.skill2Id;
          const theirSkill = isInitiator ? session.skill2Id : session.skill1Id;
          
          const myProgressObj = isInitiator ? session.progress1 : session.progress2;
          const theirProgressObj = isInitiator ? session.progress2 : session.progress1;
          
          const isExpanded = expandedSession === session._id;
          
          return (
            <div key={session._id} className="border rounded-md p-3 bg-gray-50">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(session._id)}
              >
                <div className="flex items-center gap-2">
                  <img 
                    src={otherUser.profileImage} 
                    alt={otherUser.name} 
                    className="w-8 h-8 rounded-full object-cover" 
                  />
                  <div>
                    <div className="font-medium flex items-center">
                      Exchange with {otherUser.name}
                      <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                    </div>
                    <div className="text-xs text-gray-500">
                      {mySkill?.name || 'Your skill'} ⇄ {theirSkill?.name || 'Their skill'}
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <div className="flex justify-between">
                    <div>
                      <p><span className="font-medium">Your skill:</span> {mySkill?.name}</p>
                      {myProgressObj?.notes && (
                        <p className="mt-1 text-gray-700">{myProgressObj.notes}</p>
                      )}
                    </div>
                    <div>
                      <p><span className="font-medium">Their skill:</span> {theirSkill?.name}</p>
                      {theirProgressObj?.notes && (
                        <p className="mt-1 text-gray-700">{theirProgressObj.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Started: {new Date(session.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      Completed: {new Date(session.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}