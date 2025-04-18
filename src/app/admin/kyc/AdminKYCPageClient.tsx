'use client';

import { useState } from 'react';
import { FaDownload } from 'react-icons/fa';

type KYCRecord = {
  _id: string;
  nic: string;
  recipient: string;
  status: string;
  dateSubmitted?: string;
  reviewed?: string;
  documentURL?: string;
};

export default function AdminKYCPageClient({ records }: { records: KYCRecord[] }) {
  const [kycList, setKycList] = useState(records);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/kyc/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      setKycList((prev) =>
        prev.map((rec) =>
          rec._id === id ? { ...rec, status: newStatus, reviewed: new Date().toISOString() } : rec
        )
      );
    } catch {
      alert('Error updating status');
    }
  };

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold text-[#0077b6] mb-6">Admin Dashboard - KYC</h1>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm border border-gray-300">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="p-3">NIC No</th>
              <th className="p-3">Recipient</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reviewed</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {kycList.map((rec) => (
              <tr key={rec._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{rec.nic}</td>
                <td className="p-3">{rec.recipient}</td>
                <td className="p-3">
                  {rec.dateSubmitted ? new Date(rec.dateSubmitted).toLocaleString() : '-'}
                </td>
                <td className="p-3">
                  <select
                    value={rec.status}
                    onChange={(e) => handleStatusChange(rec._id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="Not Reviewed">Not Reviewed</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                <td className="p-3">
                  {rec.reviewed ? new Date(rec.reviewed).toLocaleString() : '-'}
                </td>
                <td className="p-3">
                  {rec.documentURL ? (
                    <a
                      href={`/api/file/retreive?fileUrl=${encodeURIComponent(rec.documentURL)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaDownload className="cursor-pointer hover:text-blue-500" />
                    </a>
                  ) : (
                    <FaDownload className="text-gray-400 cursor-not-allowed" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
