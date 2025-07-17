import { progressService } from '../../services/progressService';
import { useProgress } from '../../hooks/useProgress';

interface ProgressTabProps {
  sessionId: string;
  currentUserId: string;
  session?: any;
  user?: any;
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function ProgressTab({
  sessionId,
  currentUserId,
  session,
  user,
  showAlert,
}: ProgressTabProps) {
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
