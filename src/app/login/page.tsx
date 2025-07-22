'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { showSuspendedPopup } from '@/components/ui/SuspendedPopup';

function LoginWithSearchParams() {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const redirect = searchParams?.get('redirect');
    if (redirect) {
       sessionStorage.setItem('redirectAfterLogin', redirect);
    }
  }, [searchParams]);
  
  return null;
}

const Login = () => {
  const router = useRouter();
  const { login, googleLogin, user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    setFormData({ ...formData, [name]: inputValue });
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await login(
        formData.email,
        formData.password,
        formData.rememberMe
      );

      //  If user is suspended, show the popup and abort
      if (result.suspended) {
        showSuspendedPopup(result.message, result.suspensionDetails);
        return;
      }

      if (result.success) {
        showToast('Login successful! Redirecting...', 'success');
        // …redirect logic…
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectUrl);
        } else {
          router.push('/dashboard');
        }
      } else {
        showToast(result.message || 'Login failed', 'error');
      }
 
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Google login handler
  const handleGoogleLogin = async (credential: string) => {
    // Prevent multiple simultaneous Google login requests
    if (isGoogleLoading) {
      console.log('Google login already in progress, ignoring...');
      return;
    }

    setIsGoogleLoading(true);
    
    try {
      const result = await googleLogin(credential);
      
      console.log('Google login result:', result);

      // 2 Suspension check
      if (result.suspended) {
        showSuspendedPopup(
          result.message,
          result.suspensionDetails,
          () => console.log('User closed suspension popup')
        );
        return; // stop here
      }

      if (result.success) {
        // Cancel any remaining Google prompts to prevent additional popups
        if (window.google?.accounts?.id?.cancel) {
          try {
            window.google.accounts.id.cancel();
          } catch (error) {
            // Ignore errors if cancel is not available
            console.log('Google prompt cancel not available');
          }
        }

        // Google users go directly to dashboard (no profile completion required)
        console.log('Google login successful, redirecting to dashboard');
        showToast('Google login successful! Redirecting...', 'success');
        
        // Check if there's a redirect URL stored
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectUrl);
        } else {
          router.push('/dashboard');
        }
      } else {
        showToast(result.message || 'Google login failed', 'error');
      }
    } catch (error) {
      showToast('An error occurred during Google login. Please try again.', 'error');
      console.error('Google login error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    showToast(error, 'error');
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Show loading state while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100 p-4">
      <Suspense fallback={null}>
        <LoginWithSearchParams />
      </Suspense>
      
      <div className="flex flex-col md:flex-row max-w-4xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        
        <div className="w-full md:w-1/2 p-4 bg-white">
          <div className="relative w-full h-48 md:h-full">
            <Image
              src="/login.jpg" 
              alt="Login Illustration"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">SkillSwap Hub Login</h1>
            <p className="text-sm text-gray-600 mt-1">Connect, Learn, and Share Your Skills</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-grow">
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
                  className={`pl-10 block w-full p-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400`}
                  placeholder="johndoe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600" id="email-error">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`pl-10 pr-10 block w-full p-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 password-input`}
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield'
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400 hover:text-gray-600"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600" id="password-error">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 flex justify-center"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Login
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <div>
              <GoogleLoginButton 
                onSuccess={handleGoogleLogin}
                onError={handleGoogleError}
                disabled={isGoogleLoading}
                isLoading={isGoogleLoading}
              />
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Don't have an account? <Link href="/register" className="text-blue-600 hover:text-blue-800">Create an account</Link></p>
            <p className="text-sm text-gray-600 mt-1"><Link href="/" className="text-blue-600 hover:text-blue-800">Back to Homepage</Link></p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Hide browser default password reveal button */
        .password-input::-ms-reveal,
        .password-input::-ms-clear {
          display: none;
        }
        
        .password-input::-webkit-credentials-auto-fill-button {
          display: none !important;
          visibility: hidden;
          pointer-events: none;
          position: absolute;
          right: 0;
        }
      `}</style>
    </div>
  );
};

export default Login;