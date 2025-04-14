'use client'; // ✅ Required because we use client-side hooks

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  // 👇 State hooks to handle input and errors
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 🔐 Form submission handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ⚠️ Basic validation
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // 📡 Call our custom API route
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
      } else {
        router.push('/admin/dashboard'); // ✅ Redirect after login
      }
    } catch {
      setError('Something went wrong. Please try again.');
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
          <h2 className="text-2xl font-semibold mb-6 text-center">Admin Login</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* 🧑 Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
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
                required
              />
            </div>

            {/* 🔒 Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* 🔘 Remember Me */}
            <label className="flex items-center gap-2">
              <input type="checkbox" />
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
              <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
