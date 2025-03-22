'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const VerifyOTP = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem('resetEmail');
    if (!storedEmail) {
      // Redirect to forgot password if no email is stored
      router.push('/forgot-password');
      return;
    }
    setEmail(storedEmail);
    
    // Set up the countdown timer
    const timer = setInterval(() => {
      setCountdown(prevCountdown => {
        if (prevCountdown <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [router]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Allow only digits
    if (!/^\d*$/.test(value)) return;
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    
    // Move to next input if a digit was entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    const otpString = otp.join('');
    
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpString
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('OTP verified successfully! Redirecting...');
        // Store the reset token in localStorage
        localStorage.setItem('resetToken', data.resetToken);
        
        // Wait 1.5 seconds before redirecting
        setTimeout(() => {
          router.push('/reset-password');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
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
        // Reset countdown
        setCountdown(300);
      } else {
        setErrorMessage(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100 p-4">
      <div className="flex flex-col md:flex-row max-w-4xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        {/* Left side - Image */}
        <div className="w-full md:w-1/2 p-4 bg-white">
          <div className="relative w-full h-48 md:h-full">
            <Image
              src="/verifyotpimage.jpg" 
              alt="Verify OTP Illustration"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Verify OTP</h1>
            <p className="text-sm text-gray-600 mt-1">Enter the 6-digit code sent to your email</p>
            {email && <p className="text-xs text-gray-500 mt-1">{email}</p>}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-lg mb-4 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
            <div>
              <div className="flex justify-center space-x-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    ref={(el) => { inputRefs.current[idx] = el }}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                    autoFocus={idx === 0}
                    disabled={isLoading || !!successMessage}
                  />
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-gray-600">
                  Time remaining: <span className="font-medium">{formatTime(countdown)}</span>
                </p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !!successMessage || otp.some(digit => !digit)}
                className={`w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 flex justify-center ${
                  isLoading || !!successMessage || otp.some(digit => !digit) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Verify OTP
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading || !!successMessage}
                className={`text-blue-600 hover:text-blue-800 focus:outline-none ${(countdown > 0 || isLoading || !!successMessage) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Resend OTP
              </button>
            </p>
            <p className="text-sm text-gray-600 mt-2"><Link href="/forgot-password" className="text-blue-600 hover:text-blue-800">Change Email</Link></p>
            <p className="text-sm text-gray-600 mt-1"><Link href="/login" className="text-blue-600 hover:text-blue-800">Back to Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;