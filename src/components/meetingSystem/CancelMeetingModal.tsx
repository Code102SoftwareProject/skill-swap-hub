import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface CancelMeetingModalProps {
  meetingId: string;
  onClose: () => void;
  onCancel: (meetingId: string, reason: string) => void;
  userName: string;
}

export default function CancelMeetingModal({
  meetingId,
  onClose,
  onCancel,
  userName
}: CancelMeetingModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCancel(meetingId, reason.trim());
      onClose();
    } catch (error) {
      console.error('Error cancelling meeting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 font-heading">
              Cancel Meeting
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4 font-body">
          You are about to cancel your meeting with <strong>{userName}</strong>. 
          Please provide a reason for cancellation.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-body"
              rows={4}
              placeholder="Please explain why you need to cancel this meeting..."
              maxLength={500}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {reason.length}/500 characters
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 font-body"
              disabled={isSubmitting}
            >
              Keep Meeting
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-body"
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}