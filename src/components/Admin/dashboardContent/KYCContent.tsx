"use client";

// Replace React Icons with Lucide React icons
import { Download, Check, X, Circle } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

// Type definition for KYC verification record structure
type KYCRecord = {
  _id: string;          // Unique identifier for the record
  nic: string;          
  recipient: string;    
  dateSubmitted: string; // Submission timestamp
  status: string;       // Verification status (Not Reviewed/Accepted/Rejected)
  reviewed?: string;    //  review date
  nicUrl?: string;      // url
};

// Maps verification status to text color classes for visual indication
const statusColorMap: Record<string, string> = {
  "Not Reviewed": "text-black",
  "Rejected": "text-red-600",
  "Accepted": "text-green-600",
};

// Maps verification status to status dot color classes
const dotColorMap: Record<string, string> = {
  "Not Reviewed": "bg-black",
  "Rejected": "bg-red-500",
  "Accepted": "bg-green-500",
};

export default function KYCContent() {
  // State to store all fetched KYC records
  const [records, setRecords] = useState<KYCRecord[]>([]);
  // Current filter value for status (All/Not Reviewed/Accepted/Rejected)
  const [sortStatus, setSortStatus] = useState("All");
  // Loading state for initial data fetch
  const [loading, setLoading] = useState(true);
  // Error state if data fetch fails
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all KYC records when component mounts
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
      
      // Retrieve file from backend API using the stored URL
      const response = await fetch(`/api/file/retrieve?fileUrl=${encodeURIComponent(fileUrl)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Download error:", errorData);
        throw new Error(errorData.message || 'Failed to download file');
      }
      
      // Get content type and determine appropriate file extension
      const contentType = response.headers.get('content-type') || '';
      const fileExtension = getFileExtensionFromMimeType(contentType);
      
      // Create meaningful filename using NIC number
      const downloadFileName = `NIC-${nicNumber}.${fileExtension}`;
      
      // Create downloadable blob from response
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Set up browser download mechanism
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL to prevent memory leaks
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Error downloading file:", err);
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : "Failed to download file");
    }
  };

  // Converts MIME type from response headers to appropriate file extension
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

  // Fallback to extract extension from filename if MIME type is unavailable
  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    if (parts.length <= 1) return 'pdf'; // Default extension
    return parts[parts.length - 1].toLowerCase();
  };

  // Updates verification status of a KYC record
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      toast.loading("Updating status...");
      
      // Send status update to API
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
      
      // Update record in local state with new status and review timestamp
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

  // Filter records based on currently selected status filter
  const filterRecords = records.filter((rec) => {
    return sortStatus === "All" || rec.status === sortStatus;
  });

  // Format ISO date strings to human-readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Main page heading for the KYC verification section */}
      <h1 className="text-2xl font-semibold text-[#0077b6] mb-6">Admin Dashboard - KYC</h1>

      <div className="bg-white rounded-lg shadow p-6">
      {/* Status filter selector - allows admin to filter records by verification status */}
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

      {/* Conditional rendering based on data loading state - shows appropriate UI for each state */}
      {loading ? (
        // Loading spinner displayed while fetching records from API
        <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
        <p className="mt-2 text-gray-600">Loading KYC records...</p>
        </div>
      ) : error ? (
        // Error message shown if API request fails
        <div className="text-center py-10 text-red-500">
        {error}
        </div>
      ) : records.length === 0 ? (
        // Empty state when no KYC records are found
        <div className="text-center py-10 text-gray-500">
        No KYC records found.
        </div>
      ) : (
        // Data table displaying KYC records when available
        <table className="w-full table-auto border-separate border-spacing-y-2 text-sm">
        {/* Table header with column titles */}
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
        {/* Table body with filtered KYC records */}
        <tbody>
          {filterRecords.map((record) => (
          <tr key={record._id} className="bg-white hover:bg-gray-50">
            <td className="px-4 py-3 border-b">{record.nic}</td>
            <td className="px-4 py-3 border-b">{record.recipient}</td>
            <td className="px-4 py-3 border-b">{formatDate(record.dateSubmitted)}</td>
            <td className="px-4 py-3 border-b">
            {/* Status indicator with color-coded Circle icon for visual status identification */}
            <div className="flex items-center gap-2">
              <Circle 
                className={`h-2 w-2 fill-current ${dotColorMap[record.status] || "bg-gray-500"}`} 
              />
              <span className={statusColorMap[record.status] || "text-gray-500"}>
              {record.status}
              </span>
            </div>
            </td>
            <td className="px-4 py-3 border-b">
            {/* Shows review date if available, otherwise shows dash */}
            {record.reviewed ? formatDate(record.reviewed) : "-"}
            </td>
            <td className="px-4 py-3 border-b">
            {/* Action buttons container */}
            <div className="flex items-center gap-2">
              {/* Document download button - only shown if document URL exists */}
              {record.nicUrl && (
              <button 
                onClick={() => downloadFile(record.nicUrl!, record.nic)}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                title="Download NIC document"
              >
                <Download className="h-4 w-4" />
              </button>
              )}
              
              {/* Approval/rejection buttons - conditionally rendered only for unreviewed records */}
              {record.status === "Not Reviewed" && (
              <>
                {/* Approve button - Changes status to "Accepted" */}
                <button 
                onClick={() => updateStatus(record._id, "Accepted")}
                className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                title="Approve KYC"
                >
                <Check className="h-4 w-4" />
                </button>
                {/* Reject button - Changes status to "Rejected" */}
                <button 
                onClick={() => updateStatus(record._id, "Rejected")}
                className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                title="Reject KYC"
                >
                <X className="h-4 w-4" />
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

      {/* Records count indicator - Shows filtering statistics at bottom of table */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>Showing {filterRecords.length} of {records.length} records</div>
      </div>
      </div>
    </div>
  );
}