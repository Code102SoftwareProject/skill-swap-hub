import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateMeetingModalProps {
  onClose: () => void;
  onCreate: (meetingData: any) => Promise<void>;
  receiverName: string;
}

export default function CreateMeetingModal({ 
  onClose, 
  onCreate,
  receiverName 
}: CreateMeetingModalProps) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  //! Validate Form

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      // * No Past Dates
      const selectedDate = new Date(date + 'T' + (time || '00:00'));
      if (selectedDate < new Date()) {
        newErrors.date = 'Meeting date must be in the future';
      }
    }
    
    if (!time) {
      newErrors.time = 'Time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent multiple submissions
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onCreate({
          description,
          date,
          time
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary font-body">Schedule New Meeting</h2>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              You are scheduling a meeting with <strong>{receiverName}</strong>
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description:
            </label>
            <textarea
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's this meeting about?"
              disabled={isSubmitting}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date:
            </label>
            <input
              type="date"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              disabled={isSubmitting}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Time:
            </label>
            <input
              type="time"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.time ? 'border-red-500' : 'border-gray-300'
              }`}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.time && (
              <p className="text-red-500 text-xs mt-1">{errors.time}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}