'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired, getTimeUntilExpiry } from '@/lib/utils/tokenUtils';
import apiClient from '@/lib/utils/apiClient';

// Type definitions
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; message: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  isSessionExpired: boolean;
  handleSessionExpiry: () => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  password: string;
  confirmPassword: string;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const router = useRouter();

  // Session expiry handler
  const handleSessionExpiry = () => {
    console.log('Session expired - cleaning up');
    
    // Clear all auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('resetToken');
    localStorage.removeItem('resetEmail');
    
    // Reset state
    setToken(null);
    setUser(null);
    setIsSessionExpired(true);
  };

  // Initialize auth on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          // Check if token is expired
          if (isTokenExpired(storedToken)) {
            console.log('Token expired on startup');
            handleSessionExpiry();
            return;
          }

          // Validate token with server
          try {
            const response = await fetch('/api/validate-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedToken}`
              }
            });

            if (response.ok) {
              // Token is valid
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
              
              // Set up token expiry monitoring
              setupTokenMonitoring(storedToken);
            } else {
              console.log('Token invalid on server validation');
              handleSessionExpiry();
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            handleSessionExpiry();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleSessionExpiry();
      } finally {
        setIsLoading(false);
      }
    };

    // Set up API client session expired handler
    apiClient.setSessionExpiredHandler(handleSessionExpiry);

    initializeAuth();
  }, []);

  // Token monitoring
  const setupTokenMonitoring = (tokenToMonitor: string) => {
    const checkTokenExpiry = () => {
      if (isTokenExpired(tokenToMonitor)) {
        console.log('Token expired during monitoring');
        handleSessionExpiry();
        return;
      }

      const timeUntilExpiry = getTimeUntilExpiry(tokenToMonitor);
      
      // Show warning when 5 minutes left
      if (timeUntilExpiry <= 300 && timeUntilExpiry > 240) {
        console.log('Token expiring soon - 5 minutes left');
        // You could show a warning toast here
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    
    // Cleanup function
    return () => clearInterval(interval);
  };

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Store token and user
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update state
        setToken(data.token);
        setUser(data.user);
        setIsSessionExpired(false);
        
        // Set up monitoring for new token
        setupTokenMonitoring(data.token);
        
        return { success: true, message: data.message || 'Login successful' };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    
    try {
      if (userData.password !== userData.confirmPassword) {
        setIsLoading(false);
        return { success: false, message: 'Passwords do not match' };
      }
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Store token and user for auto-login
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update state
        setToken(data.token);
        setUser(data.user);
        setIsSessionExpired(false);
        
        // Set up monitoring
        setupTokenMonitoring(data.token);
      }
      
      return { 
        success: data.success, 
        message: data.message || (data.success ? 'Registration successful' : 'Registration failed') 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'An error occurred during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      if (token) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear everything
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('resetToken');
      localStorage.removeItem('resetEmail');
      
      setToken(null);
      setUser(null);
      setIsSessionExpired(false);
      
      router.push('/login');
    }
  };

  // Handle session expired modal login
  const handleSessionExpiredLogin = () => {
    setIsSessionExpired(false);
    router.push('/login');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isSessionExpired,
    handleSessionExpiry,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Session Expired Modal */}
      {isSessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Session Expired
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Your session has expired for security reasons. Please log in again to continue.
              </p>
              <button
                onClick={handleSessionExpiredLogin}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login Again
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};