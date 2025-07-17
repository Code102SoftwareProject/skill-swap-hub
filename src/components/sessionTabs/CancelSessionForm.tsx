import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface CancelSessionFormProps {
  onSubmit: (reason: string, description: string, evidenceFiles?: string[]) => void;
  onCancel: () => void;
}

export default function CancelSessionForm({ onSubmit, onCancel }: CancelSessionFormProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Please select a reason for cancellation');
      return;
    }
    
    if (!description.trim()) {
      alert('Please provide a description for the cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim(), description.trim());
    } catch (error) {
      console.error('Error submitting cancellation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Important:</p>
            <p>Canceling this session will require approval from the other participant. Please provide a clear reason and description.</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Cancellation *
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          required
        >
          <option value="">Select a reason</option>
          <option value="schedule_conflict">Schedule Conflict</option>
          <option value="personal_emergency">Personal Emergency</option>
          <option value="technical_issues">Technical Issues</option>
          <option value="skill_mismatch">Skill Mismatch</option>
          <option value="communication_issues">Communication Issues</option>
          <option value="other_participant_unavailable">Other Participant Unavailable</option>
          <option value="changed_requirements">Changed Requirements</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide details about why you need to cancel this session. This will help the other participant understand your situation."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          rows={4}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Minimum 20 characters. Be specific and respectful.
        </p>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Keep Session
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !reason.trim() || !description.trim() || description.length < 20}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Cancellation Request'}
        </button>
      </div>
    </form>
  );
}
