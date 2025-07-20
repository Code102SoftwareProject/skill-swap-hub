"use client";

import {
  Download,
  Check,
  X,
  Circle,
  Search,
  SortDesc,
  SortAsc,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

// Regular expression for validating search input - only allows alphabets, numbers, and spaces
const SEARCH_VALIDATION_REGEX = /^[a-zA-Z0-9\s]*$/;

// Define the possible verification statuses for KYC documents
const KYC_STATUSES = {
  NOT_REVIEWED: "Not Reviewed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  ALL: "All", // Used for filtering purposes
};

// Type definition for KYC records received from the API
type KYCRecord = {
  _id: string;
  nic: string; // National Identity Card number
  recipient: string; // User who submitted the KYC
  dateSubmitted: string;
  status: string;
  reviewed?: string; // Date when the KYC was reviewed
  nicUrl?: string; // URL to NIC document file
  nicWithPersonUrl?: string; // URL to photo of person with NIC
  frontPhotoUrl?: string; // URL to front photo of ID
  backPhotoUrl?: string; // URL to back photo of ID
};

// Color mapping for different statuses to provide visual feedback
const statusColorMap: Record<string, { bg: string; text: string }> = {
  [KYC_STATUSES.NOT_REVIEWED]: { bg: "bg-gray-100", text: "text-gray-800" },
  [KYC_STATUSES.ACCEPTED]: { bg: "bg-green-50", text: "text-green-800" },
  [KYC_STATUSES.REJECTED]: { bg: "bg-red-50", text: "text-red-800" },
};

export default function KYCContent() {
  // State for KYC records and UI controls
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [sortStatus, setSortStatus] = useState(KYC_STATUSES.ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const pageSizeOptions = [5, 10, 25, 50];

  // Track loading states for asynchronous operations (downloads, status updates)
  const [loadingActions, setLoadingActions] = useState<{
    downloads: Record<string, boolean>;
    statusUpdates: Record<string, boolean>;
  }>({
    downloads: {},
    statusUpdates: {},
  });

  // Fetch KYC records from the API when component mounts
  useEffect(() => {
    async function fetchKYCRecords() {
      try {
        setLoading(true);
        const response = await fetch("/api/kyc/getAll");

        if (!response.ok) {
          throw new Error("Failed to fetch KYC records");
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

  // Log records for debugging purposes
  useEffect(() => {
    console.log("Records data:", records);
  }, [records]);

  /**
   * Download a KYC document file from the server
   * @param fileUrl URL of the file to download
   * @param nicNumber NIC number to use in the downloaded filename
   */
  const downloadFile = async (fileUrl: string, nicNumber: string) => {
    const downloadKey = `${fileUrl}-${nicNumber}`;

    // Prevent duplicate downloads
    if (loadingActions.downloads[downloadKey]) return;

    try {
      // Set loading state for this specific download
      setLoadingActions((prev) => ({
        ...prev,
        downloads: {
          ...prev.downloads,
          [downloadKey]: true,
        },
      }));

      toast.loading("Downloading file...");
      console.log("Downloading file from URL:", fileUrl);

      const response = await fetch(
        `/api/file/retrieve?fileUrl=${encodeURIComponent(fileUrl)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Download error:", errorData);
        throw new Error(errorData.message || "Failed to download file");
      }

      // Determine file type and create appropriate filename
      const contentType = response.headers.get("content-type") || "";
      const fileExtension = getFileExtensionFromMimeType(contentType);
      const downloadFileName = `NIC-${nicNumber}.${fileExtension}`;

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Create and trigger a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", downloadFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Error downloading file:", err);
      toast.dismiss();
      toast.error(
        err instanceof Error ? err.message : "Failed to download file"
      );
    } finally {
      // Reset loading state for this download
      setLoadingActions((prev) => ({
        ...prev,
        downloads: {
          ...prev.downloads,
          [downloadKey]: false,
        },
      }));
    }
  };

  /**
   * Convert MIME type to file extension
   * @param mimeType Content type from HTTP header
   * @returns Appropriate file extension
   */
  const getFileExtensionFromMimeType = (mimeType: string): string => {
    switch (mimeType.toLowerCase()) {
      case "application/pdf":
        return "pdf";
      case "image/jpeg":
      case "image/jpg":
        return "jpg";
      case "image/png":
        return "png";
      default:
        return "pdf";
    }
  };

  /**
   * Extract file extension from filename
   * @param filename Name of the file
   * @returns File extension string
   */
  const getFileExtension = (filename: string): string => {
    const parts = filename.split(".");
    if (parts.length <= 1) return "pdf";
    return parts[parts.length - 1].toLowerCase();
  };

  /**
   * Update the status of a KYC record (Accept or Reject)
   * @param id The KYC record ID to update
   * @param newStatus The new status to set
   */
  const updateStatus = async (id: string, newStatus: string) => {
    
    // Prevent duplicate status updates
    if (loadingActions.statusUpdates[id]) return;

    try {
      // Set loading state for this specific update
      setLoadingActions((prev) => ({
        ...prev,
        statusUpdates: {
          ...prev.statusUpdates,
          [id]: true,
        },
      }));

      toast.loading("Updating status...");

      const response = await fetch("/api/kyc/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state with the new status
      setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record._id === id
            ? {
                ...record,
                status: newStatus,
                reviewed: new Date().toISOString(),
              }
            : record
        )
      );

      toast.dismiss();
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.dismiss();
      toast.error("Failed to update status");
    } finally {
      // Reset loading state for this update
      setLoadingActions((prev) => ({
        ...prev,
        statusUpdates: {
          ...prev.statusUpdates,
          [id]: false,
        },
      }));
    }
  };

  /**
   * Format a date string to a user-friendly format
   * @param dateString ISO date string
   * @returns Formatted date string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Toggle between ascending and descending sort order
   */
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // Filter and sort records based on current filter settings
  const filteredAndSortedRecords = records
    .filter((rec) => {
      // Filter by status if a specific status is selected
      const statusMatches =
        sortStatus === KYC_STATUSES.ALL || rec.status === sortStatus;

      // Filter by search term (recipient name or NIC)
      const searchMatches =
        searchTerm === "" ||
        (rec.recipient &&
          rec.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.nic && rec.nic.toLowerCase().includes(searchTerm.toLowerCase()));

      return statusMatches && searchMatches;
    })
    .sort((a, b) => {
      // Sort by submission date
      const dateA = new Date(a.dateSubmitted).getTime();
      const dateB = new Date(b.dateSubmitted).getTime();

      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });

  // Calculate pagination values
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAndSortedRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(
    filteredAndSortedRecords.length / recordsPerPage
  );

  /**
   * Navigate to a specific page
   * @param pageNumber Page number to navigate to
   */
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  /**
   * Handle change in number of records shown per page
   */
  const handleRecordsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate array of page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-gray-900 dark:text-gray-900">
      <h1 className="text-2xl font-semibold text-[#0077b6] mb-6">
        Admin Dashboard - KYC
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Search and filter controls */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by recipient name"
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || SEARCH_VALIDATION_REGEX.test(value)) {
                    setSearchTerm(value);
                  } else {
                    toast.error(
                      "Only letters, numbers, and spaces are allowed"
                    );
                  }
                }}
                className="pl-10 pr-4 py-2 border rounded w-full md:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status filter dropdown */}
            <select
              className="border px-4 py-2 rounded"
              value={sortStatus}
              onChange={(e) => setSortStatus(e.target.value)}
            >
              <option value={KYC_STATUSES.ALL}>{KYC_STATUSES.ALL}</option>
              <option value={KYC_STATUSES.NOT_REVIEWED}>
                {KYC_STATUSES.NOT_REVIEWED}
              </option>
              <option value={KYC_STATUSES.ACCEPTED}>
                {KYC_STATUSES.ACCEPTED}
              </option>
              <option value={KYC_STATUSES.REJECTED}>
                {KYC_STATUSES.REJECTED}
              </option>
            </select>

            {/* Sort direction toggle button */}
            <button
              onClick={toggleSortDirection}
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
              title={
                sortDirection === "desc"
                  ? "Showing newest first"
                  : "Showing oldest first"
              }
              aria-label={`Sort by date: currently ${sortDirection === "desc" ? "newest first" : "oldest first"}`}
            >
              {sortDirection === "desc" ? (
                <>
                  <SortDesc className="h-4 w-4" /> Newest
                </>
              ) : (
                <>
                  <SortAsc className="h-4 w-4" /> Oldest
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading, error, or empty state handling */}
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="mt-2 text-gray-600">Loading KYC records...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No KYC records found.
          </div>
        ) : filteredAndSortedRecords.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No matching records found.
          </div>
        ) : (
          <>
            {/* KYC records table */}
            <table className="w-full table-auto border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">NIC</th>
                  <th className="px-4 py-2 text-left">Recipient</th>
                  <th className="px-4 py-2 text-left">Date Submitted</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Reviewed</th>
                  <th className="px-4 py-2 text-left">Documents</th>
                  <th className="px-4 py-2 text-left">Accept/Reject</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((record) => (
                  <tr key={record._id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 border-b">{record.nic}</td>
                    <td className="px-4 py-3 border-b">{record.recipient}</td>
                    <td className="px-4 py-3 border-b">
                      {formatDate(record.dateSubmitted)}
                    </td>
                    {/* Status badge with color coding */}
                    <td className="px-4 py-3 border-b">
                      <div className="flex items-center justify-start">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColorMap[record.status]?.bg || "bg-gray-100"
                          } ${statusColorMap[record.status]?.text || "text-gray-800"}`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b">
                      {record.reviewed ? formatDate(record.reviewed) : "-"}
                    </td>
                    {/* Document download buttons */}
                    <td className="px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        {record.nicUrl && (
                          <button
                            onClick={() =>
                              downloadFile(record.nicUrl as string, record.nic)
                            }
                            disabled={
                              !!loadingActions.downloads[
                                `${record.nicUrl}-${record.nic}`
                              ]
                            }
                            className={`p-2 text-xs rounded flex items-center gap-1 ${
                              loadingActions.downloads[
                                `${record.nicUrl}-${record.nic}`
                              ]
                                ? "bg-blue-200 text-blue-700 cursor-not-allowed"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                            title="Download NIC document"
                            aria-label={`Download NIC document for ${record.recipient}`}
                          >
                            <Download className="h-3 w-3" /> NIC
                          </button>
                        )}

                        {record.nicWithPersonUrl && (
                          <button
                            onClick={() =>
                              downloadFile(
                                record.nicWithPersonUrl as string,
                                record.nic
                              )
                            }
                            disabled={
                              !!loadingActions.downloads[
                                `${record.nicWithPersonUrl}-${record.nic}`
                              ]
                            }
                            className={`p-2 text-xs rounded flex items-center gap-1 ${
                              loadingActions.downloads[
                                `${record.nicWithPersonUrl}-${record.nic}`
                              ]
                                ? "bg-blue-300 text-blue-700 cursor-not-allowed"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                            title="Download person with NIC photo"
                            aria-label={`Download photo of person with NIC for ${record.recipient}`}
                          >
                            <Download className="h-3 w-3" /> Person
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Accept/Reject action buttons */}
                    <td className="px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        {record.status === KYC_STATUSES.NOT_REVIEWED && (
                          <>
                            <button
                              onClick={() =>
                                updateStatus(record._id, KYC_STATUSES.ACCEPTED)
                              }
                              className={`p-2 text-white rounded flex items-center justify-center ${
                                loadingActions.statusUpdates[record._id]
                                  ? "bg-green-300 cursor-not-allowed"
                                  : "bg-green-500 hover:bg-green-600"
                              }`}
                              title="Approve KYC"
                              disabled={
                                !!loadingActions.statusUpdates[record._id]
                              }
                              aria-label={`Approve KYC verification for ${record.recipient}`}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateStatus(record._id, KYC_STATUSES.REJECTED)
                              }
                              className={`p-2 text-white rounded flex items-center justify-center ${
                                loadingActions.statusUpdates[record._id]
                                  ? "bg-red-300 cursor-not-allowed"
                                  : "bg-red-500 hover:bg-red-600"
                              }`}
                              title="Reject KYC"
                              disabled={
                                !!loadingActions.statusUpdates[record._id]
                              }
                              aria-label={`Reject KYC verification for ${record.recipient}`}
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

            {/* Pagination controls */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Records per page selector */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="recordsPerPage"
                  className="text-sm text-gray-600"
                >
                  Show
                </label>
                <select
                  id="recordsPerPage"
                  value={recordsPerPage}
                  onChange={handleRecordsPerPageChange}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">records per page</span>
              </div>

              {/* Page navigation buttons */}
              <div className="flex items-center">
                <button
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                  aria-disabled={currentPage === 1}
                  aria-label="Go to first page"
                  className={`px-3 py-1 rounded-l border ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  First
                </button>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-disabled={currentPage === 1}
                  aria-label="Go to previous page"
                  className={`px-3 py-1 border-t border-b ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  Prev
                </button>

                {/* Dynamic page number buttons with ellipsis for large sets */}
                {(() => {
                  const renderPageNumbers = () => {
                    const buttons = [];

                    if (!totalPages || totalPages <= 0) {
                      return <></>;
                    }

                    // Simple pagination for fewer pages
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) {
                        buttons.push(
                          <button
                            key={i}
                            onClick={() => paginate(i)}
                            aria-label={`Go to page ${i}`}
                            aria-current={
                              currentPage === i ? "page" : undefined
                            }
                            className={`px-3 py-1 border-t border-b ${
                              currentPage === i
                                ? "bg-blue-500 text-white"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      return buttons;
                    }

                    // Complex pagination with ellipsis for many pages
                    buttons.push(
                      <button
                        key={1}
                        onClick={() => paginate(1)}
                        aria-label="Go to page 1"
                        aria-current={currentPage === 1 ? "page" : undefined}
                        className={`px-3 py-1 border-t border-b ${
                          currentPage === 1
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        1
                      </button>
                    );

                    let startPage: number, endPage: number;

                    // Near the beginning
                    if (currentPage <= 3) {
                      startPage = 2;
                      endPage = 5;

                      buttons.push(
                        ...Array.from(
                          {
                            length: Math.min(
                              endPage - startPage + 1,
                              totalPages - 1
                            ),
                          },
                          (_, i) => {
                            const pageNum = startPage + i;
                            if (pageNum >= totalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                aria-label={`Go to page ${pageNum}`}
                                aria-current={
                                  currentPage === pageNum ? "page" : undefined
                                }
                                className={`px-3 py-1 border-t border-b ${
                                  currentPage === pageNum
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        ).filter(Boolean)
                      );

                      if (totalPages > 6) {
                        buttons.push(
                          <span
                            key="ellipsis1"
                            className="px-3 py-1 border-t border-b"
                          >
                            ...
                          </span>
                        );
                      }
                    }
                    // Near the end
                    else if (currentPage >= totalPages - 2) {
                      buttons.push(
                        <span
                          key="ellipsis1"
                          className="px-3 py-1 border-t border-b"
                        >
                          ...
                        </span>
                      );

                      startPage = Math.max(2, totalPages - 4);
                      endPage = totalPages - 1;

                      buttons.push(
                        ...Array.from(
                          { length: endPage - startPage + 1 },
                          (_, i) => {
                            const pageNum = startPage + i;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                aria-label={`Go to page ${pageNum}`}
                                aria-current={
                                  currentPage === pageNum ? "page" : undefined
                                }
                                className={`px-3 py-1 border-t border-b ${
                                  currentPage === pageNum
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )
                      );
                    }
                    // Somewhere in the middle
                    else {
                      buttons.push(
                        <span
                          key="ellipsis1"
                          className="px-3 py-1 border-t border-b"
                        >
                          ...
                        </span>
                      );

                      // Show current page and one page before/after
                      startPage = Math.max(2, currentPage - 1);
                      endPage = Math.min(totalPages - 1, currentPage + 1);

                      buttons.push(
                        ...Array.from(
                          { length: endPage - startPage + 1 },
                          (_, i) => {
                            const pageNum = startPage + i;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                aria-label={`Go to page ${pageNum}`}
                                aria-current={
                                  currentPage === pageNum ? "page" : undefined
                                }
                                className={`px-3 py-1 border-t border-b ${
                                  currentPage === pageNum
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )
                      );

                      if (endPage < totalPages - 1) {
                        buttons.push(
                          <span
                            key="ellipsis2"
                            className="px-3 py-1 border-t border-b"
                          >
                            ...
                          </span>
                        );
                      }
                    }

                    // Always show the last page
                    if (totalPages > 1) {
                      buttons.push(
                        <button
                          key={totalPages}
                          onClick={() => paginate(totalPages)}
                          aria-label={`Go to page ${totalPages}`}
                          aria-current={
                            currentPage === totalPages ? "page" : undefined
                          }
                          className={`px-3 py-1 border-t border-b ${
                            currentPage === totalPages
                              ? "bg-blue-500 text-white"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return buttons;
                  };

                  return renderPageNumbers();
                })()}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-disabled={currentPage === totalPages}
                  aria-label="Go to next page"
                  className={`px-3 py-1 border-t border-b ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
                <button
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-disabled={currentPage === totalPages}
                  aria-label="Go to last page"
                  className={`px-3 py-1 rounded-r border ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  Last
                </button>
              </div>
            </div>

            {/* Records count summary */}
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <div>
                Showing {indexOfFirstRecord + 1}-
                {indexOfLastRecord > filteredAndSortedRecords.length
                  ? filteredAndSortedRecords.length
                  : indexOfLastRecord}{" "}
                of {filteredAndSortedRecords.length} filtered records
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
