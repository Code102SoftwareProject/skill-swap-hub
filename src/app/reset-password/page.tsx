'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/lib/context/ToastContext';

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

const ResetPassword = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [redirected, setRedirected] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  // Check for email and resetToken in localStorage on component mount
  useEffect(() => {
    // Add this flag to prevent multiple redirects
    if (redirected) return;
    
    const storedEmail = localStorage.getItem('resetEmail');
    const storedToken = localStorage.getItem('resetToken');
    
    console.log('Reset password page loaded');
    console.log('Stored email:', storedEmail);
    console.log('Stored token exists:', !!storedToken);
    
    if (!storedEmail || !storedToken) {
      console.log('Missing email or token, redirecting to forgot-password');
      setRedirected(true); // Set flag to prevent loop
      showToast('Please complete the verification process first', 'info');
      router.push('/forgot-password');
      return;
    }
    
    // Validate token with backend
    const validateToken = async () => {
      try {
        console.log('Validating reset token...');
        const response = await fetch('/api/validate-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resetToken: storedToken }),
        });
        
        const data = await response.json();
        console.log('Token validation response:', data);
        
        if (!data.success) {
          console.log('Token validation failed:', data.message);
          setRedirected(true); // Set flag to prevent loop
          showToast(data.message || 'Reset token has expired. Please restart the process.', 'error');
          localStorage.removeItem('resetEmail');
          localStorage.removeItem('resetToken');
          router.push('/forgot-password');
          return;
        }
        
        console.log('Token validation successful');
      } catch (error) {
        console.error('Error validating token:', error);
        setRedirected(true); // Set flag to prevent loop
        showToast('An error occurred validating your session', 'error');
        router.push('/forgot-password');
        return;
      }
    };

    // Only validate if we have both email and token
    if (storedEmail && storedToken) {
      setEmail(storedEmail);
      setResetToken(storedToken);
      validateToken();
    }
    
    setIsLoading(false);
  }, [router, showToast, redirected]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when typing
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
    
    // Check password strength if password field is changed
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    
    // Check if passwords match when confirmPassword is changed
    if (name === 'confirmPassword' && formData.password && value) {
      if (formData.password !== value) {
        setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
      } else {
        setErrors({ ...errors, confirmPassword: undefined });
      }
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Please use a stronger password';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Submitting password reset...');
      console.log('Reset token exists:', !!resetToken);
      
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
      console.log('Password reset response:', data);

      if (data.success) {
        showToast('Password has been reset successfully!', 'success');
        
        // Clear localStorage data
        localStorage.removeItem('resetEmail');
        localStorage.removeItem('resetToken');
        
        // Set redirected flag to prevent loop
        setRedirected(true);
        
        // Wait 2 seconds before redirecting
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        console.log('Password reset failed:', data.message);
        showToast(data.message || 'Failed to reset password', 'error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating your session...</p>
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
                  className={`pl-10 block w-full p-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400`}
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  autoFocus
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
              </div>
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600" id="password-error">{errors.password}</p>
              )}
              
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
                  className={`pl-10 block w-full p-2.5 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400`}
                  placeholder="********"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1" id="confirm-password-error">{errors.confirmPassword}</p>
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