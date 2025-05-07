import React, { useState } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface OngoingSessionsProps {
  sessions: any[];
  userId: string;
  userProfiles: any;
  onUpdateProgress: (progressId: string, data: any) => void;
}

export default function OngoingSessions({ 
  sessions, 
  userId, 
  userProfiles, 
  onUpdateProgress 
}: OngoingSessionsProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (!sessions || sessions.length === 0) return null;

  const toggleExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };
  
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Ongoing Sessions</h3>
      <div className="space-y-3">
        {sessions.map(session => {
          const isInitiator = session.user1Id === userId;
          const otherUser = isInitiator 
            ? userProfiles[session.user2Id] || { name: 'User', profileImage: '/default-avatar.png' }
            : userProfiles[session.user1Id] || { name: 'User', profileImage: '/default-avatar.png' };
          
          // Get the right progress object for current user
          const myProgressObj = isInitiator ? session.progress1 : session.progress2;
          const theirProgressObj = isInitiator ? session.progress2 : session.progress1;
          
          const mySkill = isInitiator ? session.skill1Id : session.skill2Id;
          const theirSkill = isInitiator ? session.skill2Id : session.skill1Id;
          
          const isExpanded = expandedSession === session._id;
          
          return (
            <div key={session._id} className="border rounded-md p-3 bg-white">
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
                    <p className="font-medium">Exchange with {otherUser.name}</p>
                    <div className="text-xs text-gray-500">
                      {mySkill?.name || 'Your skill'} ⇄ {theirSkill?.name || 'Their skill'}
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Your progress */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Your Progress</h4>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${myProgressObj?.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{myProgressObj?.completionPercentage || 0}% complete</span>
                        <span>Status: {myProgressObj?.status || 'not started'}</span>
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        {myProgressObj?.status !== 'completed' && (
                          <select 
                            className="text-xs border rounded p-1"
                            value={myProgressObj?.completionPercentage || 0}
                            onChange={(e) => onUpdateProgress(myProgressObj?._id, {
                              completionPercentage: parseInt(e.target.value)
                            })}
                          >
                            {Array.from({length: 11}, (_, i) => i * 10).map(value => (
                              <option key={value} value={value}>{value}%</option>
                            ))}
                          </select>
                        )}
                        
                        {myProgressObj?.status !== 'completed' && (
                          <button
                            onClick={() => onUpdateProgress(myProgressObj?._id, {
                              status: 'completed',
                              completionPercentage: 100
                            })}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Their progress */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Their Progress</h4>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${theirProgressObj?.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{theirProgressObj?.completionPercentage || 0}% complete</span>
                        <span>Status: {theirProgressObj?.status || 'not started'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm">
                    <div className="flex items-center text-xs text-gray-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      Started: {new Date(session.startDate).toLocaleDateString()}
                    </div>
                    
                    {myProgressObj?.dueDate && (
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Your due date: {new Date(myProgressObj.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    
                    {theirProgressObj?.dueDate && (
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Their due date: {new Date(theirProgressObj.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-sm font-medium">Notes</p>
                    <textarea
                      className="w-full p-2 text-sm border rounded mt-1"
                      rows={2}
                      placeholder="Add notes about your progress..."
                      value={myProgressObj?.notes || ''}
                      onChange={(e) => onUpdateProgress(myProgressObj?._id, {
                        notes: e.target.value
                      })}
                    ></textarea>
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