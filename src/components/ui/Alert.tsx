"use client";

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  showCloseButton?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function Alert({
  type,
  title,
  message,
  isOpen,
  onClose,
  showCloseButton = true,
  autoClose = false,
  autoCloseDelay = 3000
}: AlertProps) {
  React.useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isOpen, onClose]);

  if (!isOpen) return null;

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          title: 'text-green-800',
          message: 'text-green-700'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: <XCircle className="h-5 w-5 text-red-400" />,
          title: 'text-red-800',
          message: 'text-red-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-400" />,
          title: 'text-blue-800',
          message: 'text-blue-700'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: <Info className="h-5 w-5 text-gray-400" />,
          title: 'text-gray-800',
          message: 'text-gray-700'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full border rounded-lg p-4 shadow-lg ${styles.container}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={`text-sm font-medium ${styles.title} mb-1`}>
                {title}
              </h3>
            )}
            <p className={`text-sm ${styles.message}`}>
              {message}
            </p>
          </div>
          {showCloseButton && (
            <div className="ml-auto pl-3">
              <button
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-opacity-20 hover:bg-black ${styles.title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {!showCloseButton && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500' :
                type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' :
                type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500' :
                'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
              }`}
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
