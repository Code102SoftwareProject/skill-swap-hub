'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const ResetPassword = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  // Check for email and resetToken in localStorage on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('resetEmail');
    const storedToken = localStorage.getItem('resetToken');
    
    if (!storedEmail || !storedToken) {
      // Redirect to forgot password if missing data
      router.push('/forgot-password');
      return;
    }
    
    setEmail(storedEmail);
    setResetToken(storedToken);
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Check password strength if password field is changed
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };
  
  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    let feedback = '';
    
    // Length check
    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback = 'Password should be at least 8 characters long';
      setPasswordStrength(0);
      setPasswordFeedback(feedback);
      return;
    }
    
    // Uppercase letters check
    if (/[A-Z]/.test(password)) {
      strength += 1;
    }
    
    // Lowercase letters check
    if (/[a-z]/.test(password)) {
      strength += 1;
    }
    
    // Numbers check
    if (/\d/.test(password)) {
      strength += 1;
    }
    
    // Special characters check
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    }
    
    // Set feedback based on strength
    if (strength === 1) {
      feedback = 'Weak: Add uppercase, lowercase, numbers, and special characters';
    } else if (strength === 2) {
      feedback = 'Fair: Add more character types';
    } else if (strength === 3) {
      feedback = 'Good: Consider adding more character types';
    } else if (strength === 4) {
      feedback = 'Strong: Password meets most criteria';
    } else if (strength === 5) {
      feedback = 'Very strong: Excellent password!';
    }
    
    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    // Check password strength
    if (passwordStrength < 3) {
      setErrorMessage('Please use a stronger password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Password has been reset successfully! Redirecting to login...');
        
        // Clear localStorage data
        localStorage.removeItem('resetEmail');
        localStorage.removeItem('resetToken');
        
        // Wait 2 seconds before redirecting
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setErrorMessage(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100 p-4">
      <div className="flex flex-col md:flex-row max-w-4xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        {/* Left side - Image */}
        <div className="w-full md:w-1/2 p-4 bg-white">
          <div className="relative w-full h-48 md:h-full">
            <Image
              src="/resetpasswordimage.jpg" 
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
            <h1 className="text-2xl font-semibold text-gray-800">Reset Password</h1>
            <p className="text-sm text-gray-600 mt-1">Create a new password for your account</p>
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
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">New Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="pl-10 block w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoFocus
                  disabled={isLoading || !!successMessage}
                />
              </div>
              
              {formData.password && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        passwordStrength === 1 ? 'bg-red-500' : 
                        passwordStrength === 2 ? 'bg-orange-500' : 
                        passwordStrength === 3 ? 'bg-yellow-500' : 
                        passwordStrength === 4 ? 'bg-green-500' : 
                        passwordStrength === 5 ? 'bg-green-600' : ''
                      }`}
                      style={{ width: `${passwordStrength * 20}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs mt-1 ${
                    passwordStrength <= 1 ? 'text-red-500' : 
                    passwordStrength === 2 ? 'text-orange-500' : 
                    passwordStrength === 3 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {passwordFeedback}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">Confirm New Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="pl-10 block w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                  placeholder="********"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  disabled={isLoading || !!successMessage}
                />
              </div>
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !!successMessage}
                className={`w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 flex justify-center ${
                  isLoading || !!successMessage ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Reset Password
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

export default ResetPassword;