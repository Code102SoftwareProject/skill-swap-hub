import { progressService } from '../../services/progressService';
import { useProgress } from '../../hooks/useProgress';
import { WorkService } from '../../services/workService';
import { useState, useEffect } from 'react';
import type { Work } from '@/types';

interface ProgressTabProps {
  sessionId: string;
  currentUserId: string;
  session?: any;
  user?: any;
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

interface TimelineEvent {
  date: Date;
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  status?: string;
}

export default function ProgressTab({
  sessionId,
  currentUserId,
  session,
  user,
  showAlert,
}: ProgressTabProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(true);

  const {
    myProgress,
    otherProgress,
    loading,
    isEditing,
    form,
    updating,
    openEditor,
    closeEditor,
    updateForm,
    submitProgress,
    formatDate,
    getOtherUserName,
  } = useProgress({ sessionId, currentUserId, session, user });

  // Fetch works for timeline
  useEffect(() => {
    const fetchWorks = async () => {
      try {
        setLoadingWorks(true);
        const fetchedWorks = await WorkService.getSessionWorks(sessionId);
        setWorks(fetchedWorks);
      } catch (error) {
        console.error('Error fetching works:', error);
      } finally {
        setLoadingWorks(false);
      }
    };

    if (sessionId) {
      fetchWorks();
    }
  }, [sessionId]);

  // Calculate predicted end date based on current progress
  const calculatePredictedEndDate = () => {
    if (!session?.startDate) return null;
    
    const startDate = new Date(session.startDate);
    const currentDate = new Date();
    const daysElapsed = Math.max(1, Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Use individual progress rates if available, otherwise use average
    const myPercent = myProgress?.completionPercentage || 0;
    const otherPercent = otherProgress?.completionPercentage || 0;
    const avgProgress = (myPercent + otherPercent) / 2;
    
    if (avgProgress <= 0) {
      // If no progress, estimate based on expected duration or default to 30 days
      const expectedDays = session?.expectedEndDate 
        ? Math.ceil((new Date(session.expectedEndDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      return new Date(startDate.getTime() + (expectedDays * 24 * 60 * 60 * 1000));
    }
    
    // Calculate based on actual progress rate
    const progressRate = avgProgress / daysElapsed; // percentage per day
    const remainingProgress = 100 - avgProgress;
    const estimatedRemainingDays = remainingProgress / progressRate;
    
    const predictedEndDate = new Date(currentDate.getTime() + (estimatedRemainingDays * 24 * 60 * 60 * 1000));
    
    return predictedEndDate;
  };

  // Get timeline events
  const getTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    // Session start
    if (session?.startDate) {
      events.push({
        date: new Date(session.startDate),
        type: 'session_start',
        title: 'Session Started',
        description: 'Learning journey began',
        icon: '🚀',
        color: 'bg-blue-500'
      });
    }

    // Work submissions
    works.forEach(work => {
      const submitter = work.provideUser._id === currentUserId ? 'You' : getOtherUserName();
      events.push({
        date: new Date(work.provideDate),
        type: 'work_submission',
        title: 'Work Submitted',
        description: `${submitter} submitted work`,
        icon: '📝',
        color: work.acceptanceStatus === 'accepted' ? 'bg-green-500' : 
               work.acceptanceStatus === 'rejected' ? 'bg-red-500' : 'bg-yellow-500',
        status: work.acceptanceStatus
      });
    });

    // Progress milestones
    if (myProgress?.updatedAt) {
      events.push({
        date: new Date(myProgress.updatedAt),
        type: 'progress_update',
        title: 'Your Progress Update',
        description: `Progress: ${myProgress.completionPercentage}% (${progressService.getStatusDisplayText(myProgress.status)})`,
        icon: '📊',
        color: myProgress.completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
      });
    }

    if (otherProgress?.updatedAt) {
      events.push({
        date: new Date(otherProgress.updatedAt),
        type: 'progress_update',
        title: `${getOtherUserName()}'s Progress Update`,
        description: `Progress: ${otherProgress.completionPercentage}% (${progressService.getStatusDisplayText(otherProgress.status)})`,
        icon: '📊',
        color: otherProgress.completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
      });
    }

    // Session completion
    if (session?.status === 'completed' && session?.completionApprovedAt) {
      events.push({
        date: new Date(session.completionApprovedAt),
        type: 'session_completion',
        title: 'Session Completed',
        description: 'Both participants completed the session',
        icon: '🎉',
        color: 'bg-green-500'
      });
    }

    // Expected end date
    if (session?.expectedEndDate) {
      const expectedDate = new Date(session.expectedEndDate);
      const isOverdue = new Date() > expectedDate && session?.status !== 'completed';
      events.push({
        date: expectedDate,
        type: 'expected_end',
        title: isOverdue ? 'Expected End (Overdue)' : 'Expected End Date',
        description: 'Target completion date',
        icon: '🎯',
        color: isOverdue ? 'bg-red-500' : 'bg-gray-500'
      });
    }

    // Predicted end date
    const predictedDate = calculatePredictedEndDate();
    if (predictedDate && session?.status === 'active') {
      events.push({
        date: predictedDate,
        type: 'predicted_end',
        title: 'Predicted Completion',
        description: 'Based on current progress',
        icon: '🔮',
        color: 'bg-purple-500'
      });
    }

    // Sort events by date
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handleSubmit = async () => {
    const result = await submitProgress();
    if (result.success) {
      showAlert('success', result.message || 'Progress updated successfully!');
    } else {
      showAlert('error', result.message || 'Failed to update progress');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Progress Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Progress Tracking</h2>
          <button
            onClick={openEditor}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update My Progress
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Progress */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Your Progress</h3>
            {myProgress ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm font-semibold">{myProgress.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${myProgress.completionPercentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${progressService.getStatusColorClasses(myProgress.status)}`}>
                    {progressService.getStatusDisplayText(myProgress.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(myProgress.updatedAt || myProgress.startDate)}
                  </span>
                </div>
                {myProgress.notes && (
                  <div className="mt-3 p-2 bg-white rounded border">
                    <p className="text-sm text-gray-700 italic">"{myProgress.notes}"</p>
                  </div>
                )}
                {myProgress.dueDate && (
                  <div className="text-xs text-gray-500 mt-2">
                    Due: {formatDate(myProgress.dueDate)}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600">No progress recorded yet</p>
                <button
                  onClick={openEditor}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Add your first progress update
                </button>
              </div>
            )}
          </div>

          {/* Other User's Progress */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">{getOtherUserName()}'s Progress</h3>
            {otherProgress ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm font-semibold">{otherProgress.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${otherProgress.completionPercentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${progressService.getStatusColorClasses(otherProgress.status)}`}>
                    {progressService.getStatusDisplayText(otherProgress.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(otherProgress.updatedAt || otherProgress.startDate)}
                  </span>
                </div>
                {otherProgress.notes && (
                  <div className="mt-3 p-2 bg-white rounded border">
                    <p className="text-sm text-gray-700 italic">"{otherProgress.notes}"</p>
                  </div>
                )}
                {otherProgress.dueDate && (
                  <div className="text-xs text-gray-500 mt-2">
                    Due: {formatDate(otherProgress.dueDate)}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600">{getOtherUserName()} hasn't recorded progress yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Session Timeline & Milestones</h2>
          {loadingWorks && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading...</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Timeline Bar */}
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Start</span>
              <span>Progress</span>
              <span>Target End</span>
            </div>
            
            {/* Progress Timeline Bar */}
            <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
              {/* Session Duration Bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100"></div>
              
              {/* Current Progress Indicator */}
              {myProgress && otherProgress && (
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (myProgress.completionPercentage + otherProgress.completionPercentage) / 2)}%` 
                  }}
                ></div>
              )}
              
              {/* Current Time Indicator */}
              {session?.startDate && session?.status === 'active' && (() => {
                const startDate = new Date(session.startDate);
                const currentDate = new Date();
                const expectedEndDate = session.expectedEndDate ? new Date(session.expectedEndDate) : calculatePredictedEndDate();
                
                if (expectedEndDate) {
                  const totalDuration = expectedEndDate.getTime() - startDate.getTime();
                  const elapsed = currentDate.getTime() - startDate.getTime();
                  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                  
                  return (
                    <div 
                      className="absolute top-0 w-1 h-full bg-red-500 z-10 opacity-75"
                      style={{ left: `${progressPercent}%` }}
                      title="Current Time"
                    ></div>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Timeline Labels */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-gray-700">
                  {session?.startDate ? formatDate(session.startDate) : 'N/A'}
                </div>
                <div className="text-gray-500">Started</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-700">
                  {formatDate(new Date().toISOString())}
                </div>
                <div className="text-blue-500">Today</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-700">
                  {session?.expectedEndDate 
                    ? formatDate(session.expectedEndDate)
                    : calculatePredictedEndDate() 
                      ? formatDate(calculatePredictedEndDate()!.toISOString())
                      : 'TBD'
                  }
                </div>
                <div className="text-purple-500">
                  {session?.expectedEndDate ? 'Expected' : 'Predicted'}
                </div>
              </div>
            </div>
          </div>

          {/* Key Milestones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Works Submitted */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-yellow-700">{works.length}</div>
                  <div className="text-sm text-yellow-600">Works Submitted</div>
                </div>
                <div className="text-yellow-500">📝</div>
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {works.filter(w => w.acceptanceStatus === 'accepted').length} accepted, {works.filter(w => w.acceptanceStatus === 'pending').length} pending
              </div>
            </div>

            {/* Progress Updates */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-blue-700">
                    {myProgress && otherProgress ? Math.round((myProgress.completionPercentage + otherProgress.completionPercentage) / 2) : 0}%
                  </div>
                  <div className="text-sm text-blue-600">Average Progress</div>
                </div>
                <div className="text-blue-500">📊</div>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                You: {myProgress?.completionPercentage || 0}%, {getOtherUserName()}: {otherProgress?.completionPercentage || 0}%
              </div>
            </div>

            {/* Time Status */}
            <div className={`border rounded-lg p-3 ${
              session?.status === 'completed' ? 'bg-green-50 border-green-200' :
              session?.expectedEndDate && new Date() > new Date(session.expectedEndDate) ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-lg font-bold ${
                    session?.status === 'completed' ? 'text-green-700' :
                    session?.expectedEndDate && new Date() > new Date(session.expectedEndDate) ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    {session?.startDate ? Math.ceil((new Date().getTime() - new Date(session.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <div className={`text-sm ${
                    session?.status === 'completed' ? 'text-green-600' :
                    session?.expectedEndDate && new Date() > new Date(session.expectedEndDate) ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    Days {session?.status === 'completed' ? 'Completed' : 'Active'}
                  </div>
                </div>
                <div className={
                  session?.status === 'completed' ? 'text-green-500' :
                  session?.expectedEndDate && new Date() > new Date(session.expectedEndDate) ? 'text-red-500' :
                  'text-gray-500'
                }>
                  {session?.status === 'completed' ? '🎉' : 
                   session?.expectedEndDate && new Date() > new Date(session.expectedEndDate) ? '⏰' : '📅'}
                </div>
              </div>
              <div className={`text-xs mt-1 ${
                session?.status === 'completed' ? 'text-green-600' :
                session?.expectedEndDate && new Date() > new Date(session.expectedEndDate) ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {session?.status === 'completed' ? 'Session finished' :
                 session?.expectedEndDate && new Date() > new Date(session.expectedEndDate) ? 'Past expected end' :
                 'On track'}
              </div>
            </div>
          </div>

          {/* Prediction Info */}
          {(() => {
            const predictedDate = calculatePredictedEndDate();
            if (predictedDate && session?.status === 'active') {
              const daysFromNow = Math.ceil((predictedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysFromNow < 0;
              
              return (
                <div className={`mt-4 p-3 rounded-lg border ${
                  isOverdue ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={isOverdue ? 'text-red-600' : 'text-purple-600'}>
                        {isOverdue ? '⚠️' : '🔮'}
                      </span>
                      <div>
                        <h4 className={`text-sm font-medium ${
                          isOverdue ? 'text-red-900' : 'text-purple-900'
                        }`}>
                          {isOverdue ? 'Completion Overdue' : 'Predicted Completion'}
                        </h4>
                        <p className={`text-sm ${
                          isOverdue ? 'text-red-700' : 'text-purple-700'
                        }`}>
                          {formatDate(predictedDate.toISOString())} 
                          {isOverdue 
                            ? ` (${Math.abs(daysFromNow)} days overdue at current pace)`
                            : ` (${daysFromNow} days remaining)`
                          }
                        </p>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      isOverdue ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      Based on current progress
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Progress Update Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Your Progress</h3>
              
              {/* Progress Percentage */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Percentage *
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.percentage}
                    onChange={(e) => updateForm({ percentage: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-16">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.percentage}
                      onChange={(e) => updateForm({ percentage: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                      className="w-full p-2 border border-gray-300 rounded text-center"
                    />
                  </div>
                  <span className="text-sm text-gray-500">%</span>
                </div>
                {/* Progress Bar Preview */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${form.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={form.status}
                  onChange={(e) => updateForm({ status: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Notes (Optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder="Share what you've accomplished, challenges faced, or next steps..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={closeEditor}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? 'Updating...' : 'Update Progress'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
