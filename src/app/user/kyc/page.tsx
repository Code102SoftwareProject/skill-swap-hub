'use client';

import { useState } from 'react';

export default function KYCForm() {
  const [nic, setNic] = useState('');
  const [nicFront, setNicFront] = useState<File | null>(null);
  const [nicBack, setNicBack] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nicFront || !nicBack) {
      return alert('Please upload both NIC documents');
    }

    const formData = new FormData();
    formData.append('nic', nic);
    formData.append('nicFront', nicFront);
    formData.append('nicBack', nicBack);

    try {
      const res = await fetch('/api/kyc-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      alert('Uploaded successfully!');
      console.log(result);
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4 bg-white p-6 shadow rounded">
      <h2 className="text-xl font-bold">NIC Upload</h2>

      <input
        type="text"
        value={nic}
        onChange={(e) => setNic(e.target.value)}
        placeholder="NIC Number"
        className="w-full border px-4 py-2"
        required
      />

      <input
        type="file"
        onChange={(e) => setNicFront(e.target.files?.[0] || null)}
        className="w-full"
        accept=".jpg,.png,.pdf"
        required
      />
    

      <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">
        Submit
      </button>
    </form>
  );
}
