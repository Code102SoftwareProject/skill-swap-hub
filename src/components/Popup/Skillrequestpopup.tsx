"use client"

import React from 'react';
import { X } from 'lucide-react';

interface SkillDetailsModalProps {
  request: {
    _id: string;
    skillName: string;
    status: 'Pending' | 'Verified';
    documents: string[];
    description: string;
    createdAt: Date;
  };
  isOpen: boolean;
  onClose: () => void;
}

const SkillDetailsModal: React.FC<SkillDetailsModalProps> = ({
  request,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Skill Verification Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Skill Name</h3>
            <p className="text-gray-600">{request.skillName}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Status</h3>
            <span
              className={`px-3 py-1 rounded-full text-white text-sm inline-block
                ${request.status === 'Pending' ? 'bg-orange-500' : 'bg-green-500'}`}
            >
              {request.status}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Submission Date</h3>
            <p className="text-gray-600">
              {new Date(request.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">
              {request.description || 'No description provided'}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Uploaded Documents</h3>
            <div className="space-y-2">
              {request.documents.length > 0 ? (
                request.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded"
                  >
                    <span className="text-gray-600">Document {index + 1}</span>
                    <button className="text-blue-600 hover:text-blue-800">
                      View Document
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No documents uploaded</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillDetailsModal;