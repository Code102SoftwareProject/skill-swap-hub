"use client"; // ✅ Required because we use client-side hooks

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  //  State hooks to handle input and errors
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  //  Form submission handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    //  Basic validation
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    console.log("Attempting login with:", { username }); // Debug log

    // Call our custom API route
    try {
      console.log("Sending request to /api/admin/login"); // Debug log
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        // Important: include credentials to ensure cookies are sent with the request
        credentials: "include",
      });

      const data = await res.json();
      console.log("Response status:", res.status); // Debug log
      console.log("Response data:", data); // Debug log

      if (!res.ok) {
        setError(data.message || "Login failed");
      } else {
        // Instead of setTimeout, use router.refresh() before redirecting
        // This ensures Next.js updates its state with the new cookie
        console.log("Login successful! Redirecting to dashboard...");

        try {
          router.refresh(); // Refresh the current route
          router.push("/admin/dashboard"); // Redirect to dashboard
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback to window.location if router.push fails
          window.location.href = "/admin/dashboard";
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="bg-secondary px-6 py-12 flex items-center justify-center min-h-screen">
      <div className="flex flex-col md:flex-row max-w-5xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        {/* 📷 Left side image */}
        <div className="md:w-1/2 hidden md:block">
          <img
            src="/login.jpg"
            alt="Admin login illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 📝 Right side form */}
        <div className="md:w-1/2 w-full p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Admin Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* 🧑 Username Field */}
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

            {/* 🔒 Password Field */}
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

            {/* 🔘 Remember Me */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>

            {/* ❌ Error Message */}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {/* 🚀 Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Login
            </button>

            {/* 🧾 Forget Password Link */}
            <div className="text-right text-sm mt-2">
              <a href="#" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
