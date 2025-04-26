"use client";

import { FaDownload } from "react-icons/fa";
import { useState, useEffect } from "react";
import { BsCircleFill } from "react-icons/bs";
import toast from "react-hot-toast";

type KYCRecord = {
  _id: string;
  nic: string;
  recipient: string;
  dateSubmitted: string;
  status: string;
  reviewed?: string;
  nicUrl?: string;
};

const statusColorMap: Record<string, string> = {
  "Not Reviewed": "text-black",
  "Rejected": "text-red-600",
  "Accepted": "text-green-600",
};

const dotColorMap: Record<string, string> = {
  "Not Reviewed": "bg-black",
  "Rejected": "bg-red-500",
  "Accepted": "bg-green-500",
};

export default function KYCContent() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [sortStatus, setSortStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKYCRecords() {
      try {
        setLoading(true);
        const response = await fetch('/api/kyc/getAll');
        
        if (!response.ok) {
          throw new Error('Failed to fetch KYC records');
        }
        
        const data = await response.json();
        setRecords(data.data);
      } catch (err) {
        console.error("Error fetching KYC records:", err);
        setError("Failed to load KYC records");
        toast.error("Failed to load KYC records");
      } finally {
        setLoading(false);
      }
    }

    fetchKYCRecords();
  }, []);

  const downloadFile = async (fileUrl: string, nicNumber: string) => {
    try {
      toast.loading("Downloading file...");
      
      console.log("Downloading file from URL:", fileUrl);
      
      // Send the complete URL directly to the API
      // This ensures we're asking for exactly the file stored in the database
      const response = await fetch(`/api/file/retrieve?fileUrl=${encodeURIComponent(fileUrl)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Download error:", errorData);
        throw new Error(errorData.message || 'Failed to download file');
      }
      
      // Get content type from response header to determine file extension
      const contentType = response.headers.get('content-type') || '';
      const fileExtension = getFileExtensionFromMimeType(contentType);
      
      // Create a meaningful filename for the download
      const downloadFileName = `NIC-${nicNumber}.${fileExtension}`;
      
      // Create a blob from the file data
      const blob = await response.blob();
      
      // Validate that we received actual content
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Error downloading file:", err);
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : "Failed to download file");
    }
  };

  // Helper function to determine file extension from MIME type
  const getFileExtensionFromMimeType = (mimeType: string): string => {
    switch (mimeType.toLowerCase()) {
      case 'application/pdf':
        return 'pdf';
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
      default:
        return 'pdf'; // Default extension
    }
  };

  // Keep your existing getFileExtension function for fallback
  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    if (parts.length <= 1) return 'pdf'; // Default extension
    return parts[parts.length - 1].toLowerCase();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      toast.loading("Updating status...");
      
      const response = await fetch('/api/kyc/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      // Update the local state
      setRecords(records.map(record => 
        record._id === id ? {...record, status: newStatus, reviewed: new Date().toISOString()} : record
      ));
      
      toast.dismiss();
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.dismiss();
      toast.error("Failed to update status");
    }
  };

  const filterRecords = records.filter((rec) => {
    return sortStatus === "All" || rec.status === sortStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold text-[#0077b6] mb-6">Admin Dashboard - KYC</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-start items-center gap-4 mb-4">
          <select
            className="border px-4 py-2 rounded"
            value={sortStatus}
            onChange={(e) => setSortStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Not Reviewed">Not Reviewed</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="mt-2 text-gray-600">Loading KYC records...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No KYC records found.
          </div>
        ) : (
          <table className="w-full table-auto border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">NIC</th>
                <th className="px-4 py-2 text-left">Recipient</th>
                <th className="px-4 py-2 text-left">Date Submitted</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Reviewed</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterRecords.map((record) => (
                <tr key={record._id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{record.nic}</td>
                  <td className="px-4 py-3 border-b">{record.recipient}</td>
                  <td className="px-4 py-3 border-b">{formatDate(record.dateSubmitted)}</td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                      <BsCircleFill 
                        className={`h-2 w-2 ${dotColorMap[record.status] || "bg-gray-500"}`} 
                      />
                      <span className={statusColorMap[record.status] || "text-gray-500"}>
                        {record.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b">
                    {record.reviewed ? formatDate(record.reviewed) : "-"}
                  </td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                      {record.nicUrl && (
                        <button 
                          onClick={() => downloadFile(record.nicUrl!, record.nic)}
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                          title="Download NIC document"
                        >
                          <FaDownload className="h-4 w-4" />
                        </button>
                      )}
                      
                      {record.status === "Not Reviewed" && (
                        <>
                          <button 
                            onClick={() => updateStatus(record._id, "Accepted")}
                            className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                            title="Approve KYC"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => updateStatus(record._id, "Rejected")}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                            title="Reject KYC"
                          >
                            ✗
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div>Showing {filterRecords.length} of {records.length} records</div>
        </div>
      </div>
    </div>
  );
}