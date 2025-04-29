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
  
  // State for NIC validation error
  const [nicError, setNicError] = useState<string | null>(null);

  // File state to hold selected NIC document
  const [nicFile, setNicFile] = useState<File | null>(null);

  // State for photo with person holding both sides of the NIC
  const [nicWithPersonFile, setNicWithPersonFile] = useState<File | null>(null);

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

  // Validate NIC format
  const validateNIC = (nicNumber: string): boolean => {
    // Old NIC format: 9 digits followed by V or X
    const oldNICPattern = /^[0-9]{9}[VvXx]$/;
    
    // New NIC format: 12 digits only
    const newNICPattern = /^[0-9]{12}$/;
    
    return oldNICPattern.test(nicNumber) || newNICPattern.test(nicNumber);
  };

  // Handle NIC input change with validation
  const handleNicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nicValue = e.target.value;
    setNic(nicValue);
    
    if (nicValue && !validateNIC(nicValue)) {
      setNicError('Invalid NIC format. Please enter either 9 digits followed by V/X or 12 digits');
    } else {
      setNicError(null);
    }
  };

  // Handles the form submission logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic form validation
    if (!username.trim() || !nic.trim() || !nicFile || !nicWithPersonFile) {
      setStatus({message: 'Please fill all fields and upload all required photos', isError: true});
      return;
    }

    // Validate NIC format before submission
    if (!validateNIC(nic)) {
      setStatus({message: 'Please enter a valid NIC number', isError: true});
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      // Step 1: Upload the NIC document
      const nicFormData = new FormData();
      nicFormData.append('file', nicFile);

      const nicUploadRes = await fetch('/api/file/upload', {
        method: 'POST',
        body: nicFormData,
      });

      if (!nicUploadRes.ok) {
        const errorData = await nicUploadRes.json();
        throw new Error(errorData.error || errorData.message || 'NIC file upload failed');
      }
      
      const nicUploadData = await nicUploadRes.json();
      
      // Step 2: Upload photo of person holding NIC (both sides)
      const personFormData = new FormData();
      personFormData.append('file', nicWithPersonFile);

      const personUploadRes = await fetch('/api/file/upload', {
        method: 'POST',
        body: personFormData,
      });

      if (!personUploadRes.ok) {
        throw new Error('Photo with NIC upload failed');
      }
      
      const personUploadData = await personUploadRes.json();
      
      // Step 3: Save the KYC record with all file URLs
      const kycResponse = await fetch('/api/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nic: nic,
          recipient: username,
          nicUrl: nicUploadData.url, // NIC document URL
          nicWithPersonUrl: personUploadData.url  // Photo with person holding NIC
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
      setNicFile(null);
      setNicWithPersonFile(null);
      
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

            {/* NIC number input with validation */}
            <div>
              <input
                type="text"
                value={nic}
                onChange={handleNicChange}
                placeholder="NIC Number"
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${nicError ? 'border-red-500' : ''}`}
                required
              />
              {nicError && (
                <p className="mt-1 text-sm text-red-600">{nicError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter either Old NIC (9 digits + V/X) or New NIC (12 digits)
              </p>
            </div>

            {/* NIC Document upload input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIC Document
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setNicFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>

            {/* Photo of person holding both sides of NIC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo of you holding your NIC (both sides visible)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => setNicWithPersonFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Your face and both sides of your NIC should be clearly visible
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              disabled={uploading || !!nicError}
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
