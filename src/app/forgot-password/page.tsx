'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/lib/context/ToastContext';

const ForgotPassword = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Add initialLoading state to prevent redirect loops
  const [initialLoading, setInitialLoading] = useState(true);

  // Check if user already has a valid reset token
  useEffect(() => {
    const checkResetStatus = async () => {
      const resetToken = localStorage.getItem('resetToken');
      const resetEmail = localStorage.getItem('resetEmail');
      
      if (resetToken && resetEmail) {
        try {
          // Validate token before redirecting
          const response = await fetch('/api/validate-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resetToken }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            // If token is valid, redirect to reset password page
            router.push('/reset-password');
            return;
          } else {
            // If token is invalid, clear localStorage
            localStorage.removeItem('resetToken');
            localStorage.removeItem('resetEmail');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // On error, clear localStorage
          localStorage.removeItem('resetToken');
          localStorage.removeItem('resetEmail');
        }
      }
      
      setInitialLoading(false);
    };
    
    checkResetStatus();
  }, [router]);

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      validateEmail(e.target.value);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        // Store email in localStorage for the next steps
        localStorage.setItem('resetEmail', email);
        
        // Show success toast
        showToast(data.message || 'If your email is registered, you will receive a reset code shortly', 'success');
        
        // Wait 2 seconds before redirecting to show the success message
        setTimeout(() => {
          router.push('/verify-otp');
        }, 2000);
      } else {
        showToast(data.message || 'Failed to send reset code', 'error');
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state during initial check
  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100 p-4">
      <div className="flex flex-col md:flex-row max-w-4xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        {/* Left side - Image */}
        <div className="w-full md:w-1/2 p-4 bg-white">
          <div className="relative w-full h-48 md:h-full">
            <Image
              src="/forgotpasswordimage.jpg" 
              alt="Reset Password Illustration"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-6 flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Forgot Password</h1>
            <p className="text-sm text-gray-600 mt-1">Enter your email to receive a password reset code</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`pl-10 block w-full p-2.5 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400`}
                  placeholder="johndoe@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  required
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600" id="email-error">{emailError}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 flex justify-center ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Send Reset Code
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Remembered your password? <Link href="/login" className="text-blue-600 hover:text-blue-800">Back to Login</Link></p>
            <p className="text-sm text-gray-600 mt-1"><Link href="/" className="text-blue-600 hover:text-blue-800">Back to Homepage</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;