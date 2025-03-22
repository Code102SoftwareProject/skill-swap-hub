'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    
    localStorage.setItem('resetEmail', email);
    
    
    setTimeout(() => {
      router.push('/verify-otp');
    }, 1000); 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100 p-4">
      <div className="flex flex-col md:flex-row max-w-4xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
       
        <div className="w-full md:w-1/2 p-4 bg-white">
          <div className="relative w-full h-48 md:h-full">
            <Image
              src="/forgotpasswordimage.jpg" 
              alt="Reset Password Illustration"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

       
        <div className="w-full md:w-1/2 p-6 flex flex-col">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Forgot Password</h1>
            <p className="text-sm text-gray-600 mt-1">Enter your email to receive a password reset code</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
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
                  className="pl-10 block w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                  placeholder="johndoe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
                Send Reset Code
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

export default ForgotPassword;