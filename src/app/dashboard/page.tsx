'use client';

import React from 'react';
import { Edit2 } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'User';

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Hi {fullName}, Welcome back!</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Skills</h2>
          <button className="text-blue-600 hover:text-blue-800">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Skill cards */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <span className="text-red-600 text-xs">M</span>
              </div>
              <div className="ml-2">
                <h3 className="text-sm font-medium">Mobile App Development</h3>
                <p className="text-xs text-gray-500">★ 4.5 (342)</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <span className="text-blue-600 text-xs">P</span>
              </div>
              <div className="ml-2">
                <h3 className="text-sm font-medium">Photography</h3>
                <p className="text-xs text-gray-500">★ 4.8 (127)</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <span className="text-green-600 text-xs">J</span>
              </div>
              <div className="ml-2">
                <h3 className="text-sm font-medium">Java</h3>
                <p className="text-xs text-gray-500">★ 4.2 (98)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional content would go here */}
    </div>
  );
}