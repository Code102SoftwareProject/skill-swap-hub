interface ProgressTabProps {
  myProgress: any;
  otherProgress: any;
  formatDate: (dateString: string) => string;
  getOtherUserName: () => string;
  openProgressEditor: () => void;
}

export default function ProgressTab({
  myProgress,
  otherProgress,
  formatDate,
  getOtherUserName,
  openProgressEditor,
}: ProgressTabProps) {
  return (
    <div className="space-y-6">
      {/* Current Progress Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Progress Tracking</h2>
          <button
            onClick={openProgressEditor}
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
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    myProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                    myProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    myProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {myProgress.status.replace('_', ' ')}
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
                  onClick={openProgressEditor}
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
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    otherProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                    otherProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    otherProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {otherProgress.status.replace('_', ' ')}
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
    </div>
  );
}
