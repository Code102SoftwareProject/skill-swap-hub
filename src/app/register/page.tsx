'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';

const Register = () => {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'terms') {
      setAgreeToTerms(e.target.checked);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      setIsLoading(false);
      return;
    }

    // Validate terms acceptance
    if (!agreeToTerms) {
      showToast('You must agree to the Terms and Privacy Policy', 'error');
      setIsLoading(false);
      return;
    }

try {
  console.log('Submitting registration data...');
  const result = await register(formData);
  console.log('Registration result:', result);

  // In register/page.tsx, update the handleSubmit function
  if (result.success) {
  showToast('Registration successful! Redirecting to dashboard...', 'success');
  
  // Reset form
  setFormData({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    password: '',
    confirmPassword: '',
  });
  setAgreeToTerms(false);
  
  // Redirect to dashboard instead of login
  setTimeout(() => {
    router.push('/dashboard');  // Change this from '/login' to '/dashboard'
  }, 1500);
} else {
  showToast(result.message || 'Registration failed', 'error');
  console.error('Registration failed with message:', result.message);
}
    } catch (error) {
      showToast('An error occurred during registration', 'error');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100 p-4">
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto bg-white rounded-xl shadow-lg w-full">
        
        <div className="w-full md:w-1/2 p-4 sm:block">
          <div className="relative w-full h-48 md:h-full">
            <Image
              src="/register.jpg"
              alt="Register Image"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-lg shadow-md"
              priority
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Join SkillSwap Hub</h1>
            <p className="text-lg text-gray-600 mt-2">Connect, Learn, and Share Your Skills</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                placeholder="johndoe@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="title">Professional Title</label>
              <input
                id="title"
                name="title"
                type="text"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                placeholder="Software Engineer"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                placeholder="********"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={agreeToTerms}
                onChange={handleChange}
                required
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the <Link href="/terms" className="text-blue-600">Terms</Link> and <Link href="/privacy" className="text-blue-600">Privacy Policy</Link>
              </label>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 flex justify-center items-center"
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Create Account
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Already have an account? <Link href="/login" className="text-blue-600">Login</Link></p>
            <p className="text-sm text-gray-600 mt-2"><Link href="/" className="text-blue-600">Back to Homepage</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;