'use client';

import { useState } from 'react';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success) {
      setSuccessMessage('Registration successful!');
      setErrorMessage('');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        password: '',
        confirmPassword: '',
      });
    } else {
      setErrorMessage(data.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100 p-4">
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto bg-white rounded-xl shadow-lg w-full">
       
        <div className="w-full md:w-1/2 p-4 sm:block">
          <img
            src="/register.jpg"
            alt="Register Image"
            className="w-full h-48 md:h-full object-cover rounded-lg shadow-md"
          />
        </div>

       
        <div className="w-full md:w-1/2 p-6">
         
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Join SkillSwap Hub</h1>
            <p className="text-lg text-gray-600 mt-2">Connect, Learn, and Share Your Skills</p>
          </div>

          {errorMessage && <p className="text-red-500 text-center mb-4">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}

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
                required
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the <a href="/terms" className="text-blue-600">Terms</a> and <a href="/privacy" className="text-blue-600">Privacy Policy</a>
              </label>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
              >
                Create Acount
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Already have an account? <a href="/login" className="text-blue-600">Login</a></p>
            <p className="text-sm text-gray-600 mt-2"><a href="/" className="text-blue-600">Back to Homepage</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
