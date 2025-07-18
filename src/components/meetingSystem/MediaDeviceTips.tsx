'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Camera, Mic, Monitor, Smartphone } from 'lucide-react';

interface MediaDeviceTipsProps {
  isVisible: boolean;
  onClose: () => void;
}

export function MediaDeviceTips({ isVisible, onClose }: MediaDeviceTipsProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <h2 className="text-lg font-semibold">Camera & Microphone Tips</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Multiple Browser Limitation</h3>
              <p className="text-sm text-yellow-700">
                Only one browser tab can access your camera and microphone at the same time. 
                This is a security feature built into web browsers.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">If you can't access camera/microphone:</h3>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Monitor className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900">Close Other Browser Tabs</h4>
                    <p className="text-sm text-blue-700">Close any other tabs that might be using your camera (video calls, other meetings)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <Camera className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900">Close Video Applications</h4>
                    <p className="text-sm text-green-700">Close apps like Zoom, Teams, Skype, or any camera software</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Mic className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-purple-900">Check Browser Permissions</h4>
                    <p className="text-sm text-purple-700">Make sure you've allowed camera and microphone access for this website</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                  <Smartphone className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-900">Try Different Browser</h4>
                    <p className="text-sm text-orange-700">If issues persist, try opening the meeting in a different browser or incognito mode</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">💡 Pro Tips:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use one browser for video calls only</li>
                <li>• Keep other video apps closed during meetings</li>
                <li>• Refresh the page if you encounter permission issues</li>
                <li>• Use headphones to prevent echo</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <Button onClick={onClose} className="flex-1">
              Got it!
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
