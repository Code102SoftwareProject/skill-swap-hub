import React from 'react';
import { AlertTriangle, Clock, Check } from 'lucide-react';
import { formatDate, formatTime } from './MeetingCard';

interface CancellationInfo {
  _id: string;
  reason: string;
  cancelledAt: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
}

interface CancellationDetailsProps {
  cancellation: CancellationInfo;
  cancelledByName: string;
  isCurrentUser: boolean;
  onAcknowledge?: (cancellationId: string) => void;
}

export default function CancellationDetails({
  cancellation,
  cancelledByName,
  isCurrentUser,
  onAcknowledge
}: CancellationDetailsProps) {
  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-start">
        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 mb-1">
            {isCurrentUser ? 'You cancelled this meeting' : `Cancelled by ${cancelledByName}`}
          </p>
          
          <p className="text-sm text-red-700 mb-2">
            <strong>Reason:</strong> {cancellation.reason}
          </p>
          
          <div className="flex items-center text-xs text-red-600 mb-2">
            <Clock className="w-3 h-3 mr-1" />
            <span>Cancelled on {formatDate(cancellation.cancelledAt)} at {formatTime(cancellation.cancelledAt)}</span>
          </div>

          {!isCurrentUser && !cancellation.acknowledged && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(cancellation._id)}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              <Check className="w-3 h-3 mr-1" />
              Acknowledge
            </button>
          )}

          {cancellation.acknowledged && (
            <div className="flex items-center text-xs text-green-600">
              <Check className="w-3 h-3 mr-1" />
              <span>
                Acknowledged {cancellation.acknowledgedAt && 
                `on ${formatDate(cancellation.acknowledgedAt)} at ${formatTime(cancellation.acknowledgedAt)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}