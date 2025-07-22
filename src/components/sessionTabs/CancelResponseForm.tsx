import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface CancelResponseFormProps {
  onSubmit: (action: 'agree' | 'dispute', responseDescription: string, workCompletionPercentage?: number) => void;
  onCancel: () => void;
  initiatorName: string;
  reason: string;
  description: string;
}

export default function CancelResponseForm({ 
  onSubmit, 
  onCancel, 
  initiatorName, 
  reason, 
  description 
}: CancelResponseFormProps) {
  const [action, setAction] = useState<'agree' | 'dispute'>('agree');
  const [responseDescription, setResponseDescription] = useState('');
  const [workCompletionPercentage, setWorkCompletionPercentage] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!responseDescription.trim()) {
      alert('Please provide a response description');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(action, responseDescription.trim(), action === 'dispute' ? workCompletionPercentage : undefined);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Request Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Cancellation Request from {initiatorName}</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Reason:</span>
            <span className="ml-2 text-gray-600">{reason}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Description:</span>
            <p className="ml-2 text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </div>

      {/* Response Action */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Response *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="agree"
              checked={action === 'agree'}
              onChange={(e) => setAction(e.target.value as 'agree' | 'dispute')}
              className="mr-2"
            />
            <span className="text-green-700 font-medium">Agree to cancel the session</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="dispute"
              checked={action === 'dispute'}
              onChange={(e) => setAction(e.target.value as 'agree' | 'dispute')}
              className="mr-2"
            />
            <span className="text-red-700 font-medium">Dispute the cancellation</span>
          </label>
        </div>
      </div>

      {/* Work Completion Percentage (only for dispute) */}
      {action === 'dispute' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Completion Percentage *
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="100"
              value={workCompletionPercentage}
              onChange={(e) => setWorkCompletionPercentage(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-16">
              <input
                type="number"
                min="0"
                max="100"
                value={workCompletionPercentage}
                onChange={(e) => setWorkCompletionPercentage(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="w-full p-2 border border-gray-300 rounded text-center text-sm"
              />
            </div>
            <span className="text-sm text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Estimate what percentage of the work has been completed so far.
          </p>
        </div>
      )}

      {/* Response Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Response Description *
        </label>
        <textarea
          value={responseDescription}
          onChange={(e) => setResponseDescription(e.target.value)}
          placeholder={
            action === 'agree' 
              ? 'Explain why you agree with the cancellation and any additional comments...'
              : 'Explain why you dispute this cancellation request and provide your perspective...'
          }
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Be clear and professional in your response.
        </p>
      </div>

      {action === 'dispute' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Note:</p>
              <p>If you dispute this cancellation, the session will remain active and both parties will need to work together to resolve the issue. If no agreement can be reached, please contact our support team for assistance.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !responseDescription.trim()}
          className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            action === 'agree' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : action === 'agree' ? 'Agree to Cancel' : 'Submit Dispute'}
        </button>
      </div>
    </form>
  );
}
