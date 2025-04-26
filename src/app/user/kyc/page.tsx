'use client'; // Ensures this component runs on the client side

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Named import for decoding JWT

// Define a type to represent the decoded JWT payload
type DecodedToken = {
  username?: string;
  email?: string;
  sub?: string;
  [key: string]: any;
};

export default function KYCForm() {
  // State for autofilled username from JWT
  const [username, setUsername] = useState('');

  // State for NIC number entered by the user
  const [nic, setNic] = useState('');

  // File state to hold selected NIC document
  const [file, setFile] = useState<File | null>(null);

  // Loading state for upload feedback
  const [uploading, setUploading] = useState(false);

  // Status message for feedback
  const [status, setStatus] = useState<{message: string, isError: boolean} | null>(null);

  // Automatically extract and set the username from the JWT (stored in localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const name = decoded.username || decoded.email || decoded.sub || '';
        setUsername(name);
      } catch (err) {
        console.error('Invalid JWT', err);
      }
    }
  }, []);

  // Handles the form submission logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic form validation
    if (!username.trim() || !nic.trim() || !file) {
      setStatus({message: 'Please fill all fields', isError: true});
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      // Step 1: Upload the file to R2 storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || errorData.message || 'File upload failed');
      }
      
      const uploadData = await uploadRes.json();
      
      // Step 2: Save the KYC record with the file URL
      const kycResponse = await fetch('/api/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nic: nic,
          recipient: username,
          nicUrl: uploadData.url // Save the URL returned from the upload API
        }),
      });

      if (!kycResponse.ok) {
        const errorData = await kycResponse.json();
        throw new Error(errorData.error || errorData.message || 'KYC submission failed');
      }

      const kycData = await kycResponse.json();
      
      // Success message
      setStatus({
        message: 'KYC information submitted successfully!',
        isError: false
      });
      
      // Clear form
      setNic('');
      setFile(null);
      
    } catch (err: any) {
      console.error('Submission error:', err);
      setStatus({
        message: err.message || 'Something went wrong. Please try again.',
        isError: true
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="bg-secondary px-6 py-12 flex items-center justify-center min-h-screen">
      <div className="flex flex-col md:flex-row max-w-5xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        
        {/* Left side image */}
        <div className="md:w-1/2 hidden md:block">
          <img src="/kyc.png" alt="NIC Upload" className="w-full h-full object-cover" />
        </div>

        {/* Right side form */}
        <div className="bg-white p-4 max-w-md w-full py-16">
          <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white shadow rounded">
            <h2 className="text-xl font-bold text-center">NIC Document Upload</h2>

            {/* Username field (autofilled from JWT) */}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or Email"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* NIC number input */}
            <input
              type="text"
              value={nic}
              onChange={(e) => setNic(e.target.value)}
              placeholder="NIC Number"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* File upload input */}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />

            {/* Submit button */}
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Submit'}
            </button>

            {/* Status message */}
            {status && (
              <div className={`mt-4 p-3 rounded ${status.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {status.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
