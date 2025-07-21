"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { isTokenExpired, getTimeUntilExpiry } from "@/lib/utils/tokenUtils";
import apiClient from "@/lib/utils/apiClient";

// Type definitions
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<{
    success: boolean;
    message: string;
    suspended?: boolean;
    suspensionDetails?: any;
  }>;
  googleLogin: (credential: string) => Promise<{
    success: boolean;
    message: string;
    needsProfileCompletion?: boolean;
    suspended?: boolean;
    suspensionDetails?: any;
  }>;
  register: (userData: RegisterData) => Promise<{
    success: boolean;
    message: string;
    suspended?: boolean;
    suspensionDetails?: any;
  }>;
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
  const [isSessionExpiring, setIsSessionExpiring] = useState<boolean>(false);
  const [hasSessionExpired, setHasSessionExpired] = useState<boolean>(false);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Setup automatic session expiry timer
  const setupSessionTimer = (tokenToMonitor: string) => {
    // Clear any existing timer
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }

    // Calculate exact time until token expires
    const timeUntilExpiry = getTimeUntilExpiry(tokenToMonitor) * 1000; // Convert to milliseconds

    // Check if token is valid
    if (timeUntilExpiry <= 0) {
      console.error("🚨 TOKEN ALREADY EXPIRED OR INVALID!");
      return;
    }

    console.log(
      `🕐 Setting session timer for ${Math.floor(timeUntilExpiry / 1000 / 60 / 60)} hours`
    );
    console.log(
      `⏰ Session will expire at: ${new Date(Date.now() + timeUntilExpiry).toLocaleString()}`
    );

    // JavaScript setTimeout has a maximum delay of ~24.8 days (2^31-1 milliseconds)
    const MAX_TIMEOUT_MS = 2147483647; // Maximum safe setTimeout value
    
    if (timeUntilExpiry > MAX_TIMEOUT_MS) {
      console.log("⚠️ Token expiry exceeds setTimeout limit, using periodic checks instead");
      
      // For very long expiry times (30+ days), check periodically instead
      const checkInterval = setInterval(() => {
        const remainingTime = getTimeUntilExpiry(tokenToMonitor) * 1000;
        console.log(`🔄 Periodic check: ${remainingTime / 1000 / 60 / 60} hours remaining`);
        
        if (remainingTime <= 0) {
          console.log("🚨 Periodic check detected expiry - showing modal");
          clearInterval(checkInterval);
          handleSessionExpiry();
        }
      }, 60000); // Check every minute for long-lived tokens
      
      // Store interval reference for cleanup (treating it as timer)
      setSessionTimer(checkInterval as any);
    } else {
      // For normal timeouts (< 24.8 days), use regular setTimeout
      const timer = setTimeout(() => {
        console.log("🚨 Session timer expired - showing modal automatically");
        handleSessionExpiry();
      }, timeUntilExpiry);

      setSessionTimer(timer);
    }
  };

  // Clear session timer (handles both setTimeout and setInterval)
  const clearSessionTimer = () => {
    if (sessionTimer) {
      // Clear both timeout and interval (one will be a no-op)
      clearTimeout(sessionTimer);
      clearInterval(sessionTimer);
      setSessionTimer(null);
      console.log("🧹 Session timer/interval cleared");
    }
  };

  // PROTECTED session expiry handler - ONLY ONE POPUP
  const handleSessionExpiry = () => {
    // STRONG PROTECTION: Prevent any duplicate calls
    if (isSessionExpiring || isSessionExpired || hasSessionExpired) {
      console.log("❌ Session expiry already handled, ignoring duplicate call");
      return;
    }

    console.log("✅ Session expired - showing popup (FIRST TIME ONLY)");

    // Set ALL protection flags immediately
    setIsSessionExpiring(true);
    setHasSessionExpired(true);

    // Clear timer
    clearSessionTimer();

    // Clear all auth data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("resetToken");
    localStorage.removeItem("resetEmail");

    // Reset auth state
    setToken(null);
    setUser(null);

    // Show the popup
    setIsSessionExpired(true);

    // Reset protection flag after modal shows
    setTimeout(() => {
      setIsSessionExpiring(false);
    }, 1000);
  };

  // Initialize auth on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Check if token is expired
          if (isTokenExpired(storedToken)) {
            console.log("Token expired on startup");
            handleSessionExpiry();
            return;
          }

          // Validate token with server
          try {
            const response = await fetch("/api/validate-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${storedToken}`,
              },
            });

            const validationData = await response.json();

            if (response.ok) {
              // Token is valid
              setToken(storedToken);
              // Use the updated user data from server validation instead of localStorage
              setUser(validationData.user);

              // Update localStorage with the latest user data
              localStorage.setItem("user", JSON.stringify(validationData.user));

              // Set up automatic timer
              setupSessionTimer(storedToken);
            } else {
              // Check if user is suspended
              if (
                validationData.suspended ||
                validationData.suspensionDetails
              ) {
                console.log("🚨 User is suspended during token validation");
                // Redirect to suspended page with suspension details
                router.push(
                  `/account-suspended?reason=${encodeURIComponent(validationData.suspensionDetails?.reason || "Account suspended")}&notes=${encodeURIComponent(validationData.suspensionDetails?.notes || "")}&date=${encodeURIComponent(validationData.suspensionDetails?.suspendedAt || "")}`
                );
              } else {
                console.log("Token invalid on server validation");
                handleSessionExpiry();
              }
            }
          } catch (error) {
            console.error("Token validation failed:", error);
            handleSessionExpiry();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        handleSessionExpiry();
      } finally {
        setIsLoading(false);
      }
    };

    // Set up API client session expired handler
    apiClient.setSessionExpiredHandler(handleSessionExpiry);

    initializeAuth();

    // Cleanup timer on unmount
    return () => {
      clearSessionTimer();
    };
  }, []);

  // Login function
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<{
    success: boolean;
    message: string;
    suspended?: boolean;
    suspensionDetails?: any;
  }> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      // IMPORTANT: Check suspension first, even for non-200 responses
      if (data.suspended || data.suspensionDetails) {
        console.log("🚨 User is suspended, returning suspension details");
        return {
          success: false,
          message: data.message || "Account suspended",
          suspended: true,
          suspensionDetails: data.suspensionDetails,
        };
      }

      if (data.success) {
        // Store token and user
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Update state
        setToken(data.token);
        setUser(data.user);

        // Reset ALL session expiry flags on new login
        setIsSessionExpired(false);
        setIsSessionExpiring(false);
        setHasSessionExpired(false);

        // Set up automatic timer for new token
        setupSessionTimer(data.token);

        return { success: true, message: data.message || "Login successful" };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "An error occurred during login. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Google login function
  const googleLogin = async (
    credential: string
  ): Promise<{
    success: boolean;
    message: string;
    needsProfileCompletion?: boolean;
    suspended?: boolean;
    suspensionDetails?: any;
  }> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      // IMPORTANT: Check suspension first, even for non-200 responses
      if (data.suspended || data.suspensionDetails) {
        console.log(
          "🚨 User is suspended via Google login, returning suspension details"
        );
        return {
          success: false,
          message: data.message || "Account suspended",
          suspended: true,
          suspensionDetails: data.suspensionDetails,
        };
      }

      if (data.success) {
        // Store token and user
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Update state
        setToken(data.token);
        setUser(data.user);

        // Reset ALL session expiry flags on new login
        setIsSessionExpired(false);
        setIsSessionExpiring(false);
        setHasSessionExpired(false);

        // Set up automatic timer for new token
        setupSessionTimer(data.token);

        return {
          success: true,
          message: data.message || "Google login successful",
          needsProfileCompletion: data.needsProfileCompletion,
        };
      } else {
        return {
          success: false,
          message: data.message || "Google login failed",
        };
      }
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        message: "An error occurred during Google login. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    userData: RegisterData
  ): Promise<{
    success: boolean;
    message: string;
    suspended?: boolean;
    suspensionDetails?: any;
  }> => {
    setIsLoading(true);

    try {
      if (userData.password !== userData.confirmPassword) {
        setIsLoading(false);
        return { success: false, message: "Passwords do not match" };
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      // IMPORTANT: Check suspension first, even for non-200 responses
      if (data.suspended || data.suspensionDetails) {
        console.log(
          "🚨 User is suspended during registration, returning suspension details"
        );
        return {
          success: false,
          message: data.message || "Account suspended",
          suspended: true,
          suspensionDetails: data.suspensionDetails,
        };
      }

      if (data.success) {
        // Store token and user for auto-login
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Update state
        setToken(data.token);
        setUser(data.user);

        // Reset session expiry flags
        setIsSessionExpired(false);
        setIsSessionExpiring(false);
        setHasSessionExpired(false);

        // Set up automatic timer
        setupSessionTimer(data.token);
      }

      return {
        success: data.success,
        message:
          data.message ||
          (data.success ? "Registration successful" : "Registration failed"),
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during registration",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // PROTECTED logout function
  const logout = async () => {
    console.log("🚪 Logout initiated");

    try {
      // Clear timer first
      clearSessionTimer();

      // If session already expired, skip API call
      if (!hasSessionExpired && token) {
        try {
          await fetch("/api/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("✅ Logout API call successful");
        } catch (error) {
          console.log("⚠️ Logout API call failed (token might be expired)");
        }
      } else {
        console.log("🔄 Skipping logout API call - session already expired");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear everything regardless of API success
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("resetToken");
      localStorage.removeItem("resetEmail");

      // Reset ALL states
      setToken(null);
      setUser(null);
      setIsSessionExpired(false);
      setIsSessionExpiring(false);
      setHasSessionExpired(false);

      console.log("🧹 All auth data cleared");
      router.push("/login");
    }
  };

  // Handle session expired modal login
  const handleSessionExpiredLogin = () => {
    console.log("🔐 User clicked Login Again - redirecting to login");

    // Clear all session states
    setIsSessionExpired(false);
    setIsSessionExpiring(false);
    setHasSessionExpired(false);

    // Clear timer just in case
    clearSessionTimer();

    // Redirect to login
    router.push("/login");
  };

  const value = {
    user,
    token,
    login,
    googleLogin,
    register,
    logout,
    isLoading,
    isSessionExpired,
    handleSessionExpiry,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* SINGLE Session Expired Modal - Protected Against Duplicates */}
      {isSessionExpired && !isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Session Expired
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Your session has expired for security reasons. Please log in
                again to continue.
              </p>
              <button
                onClick={handleSessionExpiredLogin}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
