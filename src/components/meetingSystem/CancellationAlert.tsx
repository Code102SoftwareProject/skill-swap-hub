"use client";

import { AlertTriangle, X, Clock, User } from 'lucide-react';

interface CancellationAlertData {
  _id: string;
  meetingId: string;
  reason: string;
  cancelledAt: string;
  cancellerName: string;
  meetingTime: string;
  meetingDescription?: string; // Made optional since it might not always be present
}

interface CancellationAlertProps {
  cancellation: CancellationAlertData;
  onAcknowledge: (cancellationId: string) => void;
  loading?: boolean;
}

export default function CancellationAlert({ 
  cancellation, 
  onAcknowledge, 
  loading = false 
}: CancellationAlertProps) {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCancellationTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800">
                Meeting Cancelled by {cancellation.cancellerName}
              </h3>
            </div>
            
            <div className="space-y-2 text-sm text-red-700">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span>
                  <strong>Meeting:</strong> {formatDateTime(cancellation.meetingTime)}
                </span>
              </div>
              
              <div>
                <strong>Description:</strong> {cancellation.meetingDescription || 'Meeting'}
              </div>
              
              <div>
                <strong>Reason:</strong> {cancellation.reason}
              </div>
              
              <div className="text-xs text-red-600">
                Cancelled on {formatCancellationTime(cancellation.cancelledAt)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={() => onAcknowledge(cancellation._id)}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-700 bg-red-100 border border-red-300 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                Acknowledging...
              </>
            ) : (
              <>
                <X className="w-3 h-3 mr-1" />
                Acknowledge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
