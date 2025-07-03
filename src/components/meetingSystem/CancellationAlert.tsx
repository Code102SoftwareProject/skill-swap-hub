import React from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { formatDate, formatTime } from './MeetingCard';

interface CancellationAlertProps {
  cancellations: Array<{
    meetingId: string;
    reason: string;
    cancelledAt: string;
    cancelledBy: string;
    cancellerName: string;
    meetingTime: string;
    acknowledged: boolean;
  }>;
  currentUserId: string;
  onDismiss: (meetingId: string) => void;
  onAcknowledge: (meetingId: string) => void;  // Changed from cancellationId to meetingId
}

export default function CancellationAlert({
  cancellations,
  currentUserId,
  onDismiss,
  onAcknowledge
}: CancellationAlertProps) {
  if (cancellations.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {cancellations.map((cancellation) => {
        const isCancelledByCurrentUser = cancellation.cancelledBy === currentUserId;
        
        return (
          <div 
            key={cancellation.meetingId}
            className={`p-4 rounded-lg border ${
              isCancelledByCurrentUser 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${
                  isCancelledByCurrentUser ? 'text-orange-500' : 'text-red-500'
                }`} />
                <div className="flex-1">
                  <h4 className={`font-semibold text-sm ${
                    isCancelledByCurrentUser ? 'text-orange-800' : 'text-red-800'
                  }`}>
                    {isCancelledByCurrentUser 
                      ? 'You cancelled a meeting' 
                      : `${cancellation.cancellerName} cancelled your meeting`}
                  </h4>
                  
                  <div className="mt-1 space-y-1">
                    <div className={`text-xs flex items-center ${
                      isCancelledByCurrentUser ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>
                        Meeting was scheduled for {formatDate(cancellation.meetingTime)} at {formatTime(cancellation.meetingTime)}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${
                      isCancelledByCurrentUser ? 'text-orange-700' : 'text-red-700'
                    }`}>
                      <strong>Reason:</strong> {cancellation.reason}
                    </p>
                    
                    <p className={`text-xs ${
                      isCancelledByCurrentUser ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      Cancelled on {formatDate(cancellation.cancelledAt)} at {formatTime(cancellation.cancelledAt)}
                    </p>
                  </div>

                  {!isCancelledByCurrentUser && !cancellation.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(cancellation.meetingId)}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => onDismiss(cancellation.meetingId)}
                className={`p-1 rounded hover:bg-opacity-20 ${
                  isCancelledByCurrentUser 
                    ? 'text-orange-400 hover:bg-orange-500' 
                    : 'text-red-400 hover:bg-red-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}