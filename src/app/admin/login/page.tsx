"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Constants for API endpoints and error messages
const LOGIN_API_URL = "/api/admin/login";
const DASHBOARD_URL = "/admin/dashboard";
const ERROR_MESSAGES = {
  EMPTY_FIELDS: "Please fill in all fields.",
  LOGIN_FAILED: "Login failed",
  GENERAL_ERROR: "Something went wrong. Please try again.",
};

export default function AdminLoginPage() {
  const router = useRouter();

  // State management for form inputs and UI controls
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handles the login form submission
   * - Validates form inputs
   * - Sends authentication request to server
   * - Handles navigation on success
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Form validation
    if (!username || !password) {
      setError(ERROR_MESSAGES.EMPTY_FIELDS);
      return;
    }

    try {
      // Send login request to the server
      const res = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Include cookies for session management
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle authentication failure
        setError(data.message || ERROR_MESSAGES.LOGIN_FAILED);
      } else {
        // Handle successful login with fallback navigation
        try {
          router.refresh(); // Refresh current page data
          router.push(DASHBOARD_URL); // Navigate to dashboard
        } catch (navError) {
          // Fallback navigation method if router.push fails
          window.location.href = DASHBOARD_URL;
        }
      }
    } catch (err) {
      // Handle network or other unexpected errors
      setError(ERROR_MESSAGES.GENERAL_ERROR);
    }
  };

  return (
    <main className="bg-secondary px-6 py-12 flex items-center justify-center min-h-screen">
      {/* Login card container with responsive layout */}
      <div className="flex flex-col md:flex-row max-w-5xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        {/* Left side image - hidden on mobile */}
        <div className="md:w-1/2 hidden md:block">
          <img
            src="/login.jpg"
            alt="Admin login illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side login form */}
        <div className="md:w-1/2 w-full p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Admin Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username input field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            {/* Password input field with visibility toggle */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                {/* Password visibility toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me checkbox */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>

            {/* Error message display */}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {/* Login button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
