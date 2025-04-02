'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full text-center">
        <div className="relative w-full h-48 mx-auto">
          <Image
            src="/not-found.svg" // Add a 404 image to your public folder
            alt="404 Illustration"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        <h1 className="mt-8 text-4xl font-bold text-gray-800">Oops! Page not found</h1>
        
        <p className="mt-4 text-lg text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
          >
            Go Back
          </button>
          
          <div className="flex justify-center">
            <Link
              href="/"
              className="px-6 py-3 text-blue-600 hover:text-blue-800 focus:outline-none transition duration-300"
            >
              Return to Home
            </Link>
          </div>
        </div>
        
        <div className="mt-12 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}