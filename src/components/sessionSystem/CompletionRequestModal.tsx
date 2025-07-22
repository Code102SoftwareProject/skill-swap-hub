"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  X,
  BarChart3,
  Calendar
} from 'lucide-react';

interface Work {
  _id: string;
  workDescription: string;
  acceptanceStatus: 'pending' | 'accepted' | 'rejected';
  provideDate: string;
  workFiles: any[];
  provideUser: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
}

interface Progress {
  completionPercentage: number;
  status: string;
  notes?: string;
}

interface CompletionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  session: any;
  currentUserId: string;
  loading?: boolean;
}

export default function CompletionRequestModal({
  isOpen,
  onClose,
  onConfirm,
  session,
  currentUserId,
  loading = false
}: CompletionRequestModalProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [myProgress, setMyProgress] = useState<Progress | null>(null);
  const [otherProgress, setOtherProgress] = useState<Progress | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch work and progress data
  useEffect(() => {
    if (!isOpen || !session) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Fetch works
        const worksResponse = await fetch(`/api/work?session=${session._id}`);
        if (worksResponse.ok) {
          const worksData = await worksResponse.json();
          setWorks(worksData.works || []);
        }

        // Fetch progress
        const progressResponse = await fetch(`/api/session-progress/${session._id}`);
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          
          if (progressData.success && progressData.progress) {
            // Find my progress and other user's progress
            const myProg = progressData.progress.find((p: any) => {
              const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
              return progUserId.toString() === currentUserId.toString();
            });
            
            const otherProg = progressData.progress.find((p: any) => {
              const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
              return progUserId.toString() !== currentUserId.toString();
            });
            
            setMyProgress(myProg || null);
            setOtherProgress(otherProg || null);
          }
        }
      } catch (error) {
        console.error('Error fetching completion data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen, session, currentUserId]);

  if (!isOpen) return null;

  // Early return if session is not provided or is invalid
  if (!session || !session.user1Id || !session.user2Id) {
    return null;
  }

  // Calculate statistics
  const myWorks = works.filter(w => w.provideUser && w.provideUser._id === currentUserId);
  const otherWorks = works.filter(w => w.provideUser && w.provideUser._id !== currentUserId);
  
  const myAcceptedWorks = myWorks.filter(w => w.acceptanceStatus === 'accepted').length;
  const otherAcceptedWorks = otherWorks.filter(w => w.acceptanceStatus === 'accepted').length;
  
  const myProgressPercentage = myProgress?.completionPercentage || 0;
  const otherProgressPercentage = otherProgress?.completionPercentage || 0;
  
  const averageProgress = Math.round((myProgressPercentage + otherProgressPercentage) / 2);

  // Get other user info
  const otherUser = session?.user1Id?._id === currentUserId ? session?.user2Id : session?.user1Id;
  const otherUserName = otherUser?.firstName ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim() : 'Other participant';

  // Check if completion looks ready
  const isReadyForCompletion = myProgressPercentage >= 80 && otherProgressPercentage >= 80;
  const hasMinimumWork = myWorks.length > 0 || otherWorks.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Request Session Completion</h2>
              <p className="text-sm text-gray-600">Review session progress before requesting completion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading session data...</span>
            </div>
          ) : (
            <>
              {/* Progress Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Session Progress Overview
                  </h3>
                  <span className={`text-2xl font-bold ${
                    averageProgress >= 80 ? 'text-green-600' : 
                    averageProgress >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {averageProgress}%
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* My Progress */}
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Progress</span>
                      <span className="text-lg font-semibold text-blue-600">{myProgressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${myProgressPercentage}%` }}
                      ></div>
                    </div>
                    {myProgress?.status && (
                      <span className="text-xs text-gray-500 mt-1 block capitalize">
                        Status: {myProgress.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Other User's Progress */}
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{otherUserName}'s Progress</span>
                      <span className="text-lg font-semibold text-green-600">{otherProgressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${otherProgressPercentage}%` }}
                      ></div>
                    </div>
                    {otherProgress?.status && (
                      <span className="text-xs text-gray-500 mt-1 block capitalize">
                        Status: {otherProgress.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Summary */}
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-600" />
                  Work Submissions Summary
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{myWorks.length}</div>
                    <div className="text-sm text-gray-600">Your Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{myAcceptedWorks}</div>
                    <div className="text-sm text-gray-600">Your Accepted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{otherWorks.length}</div>
                    <div className="text-sm text-gray-600">{otherUserName}'s Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{otherAcceptedWorks}</div>
                    <div className="text-sm text-gray-600">Their Accepted</div>
                  </div>
                </div>
              </div>

              {/* Session Timeline */}
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                  Session Timeline
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Start Date:</span>
                    <p className="text-gray-900">{new Date(session.startDate).toLocaleDateString()}</p>
                  </div>
                  {session.expectedEndDate && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Expected End:</span>
                      <p className="text-gray-900">{new Date(session.expectedEndDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Readiness Assessment */}
              <div className={`rounded-lg p-4 border-2 ${
                isReadyForCompletion 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {isReadyForCompletion ? (
                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      isReadyForCompletion ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {isReadyForCompletion ? 'Ready for Completion!' : 'Consider These Points'}
                    </h4>
                    <div className="mt-2 space-y-1">
                      <div className={`flex items-center text-sm ${
                        myProgressPercentage >= 80 ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        <span className="w-2 h-2 rounded-full mr-2 bg-current"></span>
                        Your progress: {myProgressPercentage >= 80 ? 'Great!' : 'Consider reaching 80%+'}
                      </div>
                      <div className={`flex items-center text-sm ${
                        otherProgressPercentage >= 80 ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        <span className="w-2 h-2 rounded-full mr-2 bg-current"></span>
                        {otherUserName}'s progress: {otherProgressPercentage >= 80 ? 'Great!' : 'They might need more time'}
                      </div>
                      <div className={`flex items-center text-sm ${
                        hasMinimumWork ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        <span className="w-2 h-2 rounded-full mr-2 bg-current"></span>
                        Work submissions: {hasMinimumWork ? 'Both have submitted work' : 'Consider submitting work first'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">What happens next?</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {otherUserName} will receive a notification about your completion request. 
                      They can either approve it (marking the session as completed) or decline it with feedback. 
                      Once approved, both of you will be able to rate and review each other.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || loadingData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Requesting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Request Completion</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
