'use client';

import { useState } from 'react';

export default function KYCForm() {
  // 🔹 State for NIC number input
  const [nic, setNic] = useState('');

  // 🔹 File upload state
  const [file, setFile] = useState<File | null>(null);

  // 🔹 Loading indicator during file upload
  const [uploading, setUploading] = useState(false);

  // 🔹 Store uploaded file URL to show on screen
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // 🔸 Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nic.trim()) {
      alert('Please enter your NIC number');
      return;
    }

    if (!file) {
      alert('Please select a NIC file');
      return;
    }

    setUploading(true);

    // 🔸 Step 1: Upload file to R2 bucket via /api/file/upload
    const formData = new FormData();
    formData.append('file', file); // Must match backend key: "file"

    try {
      const res = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json(); // Expecting JSON response from backend

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Upload failed');
      }

      setUploadedUrl(data.url); // Save the uploaded file URL for display
      alert('File uploaded successfully!');

      // 🔸 You can now send `nic` and `data.url` to MongoDB backend if needed

    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="bg-secondary px-6 py-12 flex items-center justify-center min-h-screen">
      <div className="flex flex-col md:flex-row max-w-5xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        {/* 📷 Left side image */}
        <div className="md:w-1/2 hidden md:block">
          <img
            src="/kyc.png"
            alt="NIC Upload KYC illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 📝 Right side form */}
        <div className="bg-white shadow-lg rounded-xl p-4 max-w-md w-full py-16">
          <form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto mt-10 space-y-4 bg-white p-6 shadow rounded mx-auto space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-800 text-center mb-6">NIC Document Upload</h2>

            {/* NIC number input field */}
            <input
              type="text"
              value={nic}
              onChange={(e) => setNic(e.target.value)}
              placeholder="Enter NIC Number"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* File input for NIC document */}
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
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 "
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Submit'}
            </button>

            {/* Show uploaded URL if successful */}
            {uploadedUrl && (
              <p className="text-green-600 text-sm break-words mt-2">
                File uploaded to: <a href={uploadedUrl} target="_blank" className="underline">{uploadedUrl}</a>
              </p>
            )}
          </form>
        </div>

      </div>
    </main>
  );
}
