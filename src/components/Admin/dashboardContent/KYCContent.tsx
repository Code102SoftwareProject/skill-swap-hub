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

/**
 * KYC status constants to avoid magic strings
 */
const KYC_STATUSES = {
  NOT_REVIEWED: "Not Reviewed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  ALL: "All",
};

/**
 * Type definition for KYC verification record
 */
type KYCRecord = {
  _id: string;
  nic: string;
  recipient: string;
  dateSubmitted: string;
  status: string; // "Not Reviewed", "Accepted", or "Rejected"
  reviewed?: string; // Timestamp of when review occurred
  nicUrl?: string; // URL to stored NIC image/document
  nicWithPersonUrl?: string; // URL to stored photo of person holding NIC
  frontPhotoUrl?: string; // URL to stored photo of person holding NIC front
  backPhotoUrl?: string; // URL to stored photo of person holding NIC back
};

// Visual styling maps for status indicators
const statusColorMap: Record<string, { bg: string; text: string }> = {
  [KYC_STATUSES.NOT_REVIEWED]: { bg: "bg-gray-100", text: "text-gray-800" },
  [KYC_STATUSES.ACCEPTED]: { bg: "bg-green-50", text: "text-green-800" },
  [KYC_STATUSES.REJECTED]: { bg: "bg-red-50", text: "text-red-800" },
};

const dotColorMap: Record<string, string> = {
  [KYC_STATUSES.NOT_REVIEWED]: "bg-gray-200",
  [KYC_STATUSES.REJECTED]: "bg-red-100",
  [KYC_STATUSES.ACCEPTED]: "bg-green-100",
};

export default function KYCContent() {
  // State management
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

  // New state for tracking loading states by action and record ID
  const [loadingActions, setLoadingActions] = useState<{
    downloads: Record<string, boolean>;
    statusUpdates: Record<string, boolean>;
  }>({
    downloads: {},
    statusUpdates: {},
  });

  useEffect(() => {
    /**
     * Fetches all KYC verification records from the API
     */
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

  useEffect(() => {
    console.log("Records data:", records);
  }, [records]);

  /**
   * Downloads document file from the server
   *
   * @param fileUrl - URL of the file to download
   * @param nicNumber - NIC number to use in filename
   * @returns Promise that resolves when download is complete
   * @throws Error if download fails
   */
  const downloadFile = async (fileUrl: string, nicNumber: string) => {
    // Create a unique key for this download operation
    const downloadKey = `${fileUrl}-${nicNumber}`;

    // Check if this download is already in progress
    if (loadingActions.downloads[downloadKey]) return;

    try {
      // Set this specific download as loading
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

      // Get content type and determine appropriate file extension
      const contentType = response.headers.get("content-type") || "";
      const fileExtension = getFileExtensionFromMimeType(contentType);
      const downloadFileName = `NIC-${nicNumber}.${fileExtension}`;

      // Create downloadable blob from response
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Set up browser download mechanism
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
      // Clear the loading state for this download
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
   * Determines file extension based on MIME type
   *
   * @param mimeType - MIME type from response headers
   * @returns Appropriate file extension string
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
        return "pdf"; // Default extension
    }
  };

  /**
   * Extracts extension from filename when MIME type unavailable
   *
   * @param filename - Full filename with extension
   * @returns File extension string
   */
  const getFileExtension = (filename: string): string => {
    const parts = filename.split(".");
    if (parts.length <= 1) return "pdf";
    return parts[parts.length - 1].toLowerCase();
  };

  /**
   * Updates verification status of a KYC record
   *
   * @param id - Record ID to update
   * @param newStatus - New status value ("Accepted" or "Rejected")
   * @returns Promise that resolves when status update is complete
   * @throws Error if update fails
   */
  const updateStatus = async (id: string, newStatus: string) => {
    // Check if status update is already in progress
    if (loadingActions.statusUpdates[id]) return;

    try {
      // Set this specific status update as loading
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

      // Update local record with new status and review timestamp using callback version
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
      // Clear the loading state for this status update
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
   * Formats ISO date string to readable format
   *
   * @param dateString - ISO date string
   * @returns Formatted date string in Month Day, Year format
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Toggles sort direction between ascending and descending
   * Controls whether newest or oldest submissions appear first
   */
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // Apply filters and sorting to records
  const filteredAndSortedRecords = records
    .filter((rec) => {
      // Filter by status
      const statusMatches =
        sortStatus === KYC_STATUSES.ALL || rec.status === sortStatus;

      // Filter by search term (case-insensitive)
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
   * Changes current page in pagination
   *
   * @param pageNumber - Page number to navigate to
   */
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  /**
   * Updates records per page setting
   *
   * @param e - Change event from select input
   */
  const handleRecordsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate page numbers for pagination controls
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Component render
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Main page heading for the KYC verification section */}
      <h1 className="text-2xl font-semibold text-[#0077b6] mb-6">
        Admin Dashboard - KYC
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Filter controls row - status filter, search input, and sort toggle */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            {/* Search input field - moved to the left */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by recipient name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded w-full md:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status filter dropdown - moved to the right side */}
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

            {/* Date sort toggle button */}
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

        {/* Conditional rendering based on data loading state - shows appropriate UI for each state */}
        {loading ? (
          // Loading spinner displayed while fetching records from API
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="mt-2 text-gray-600">Loading KYC records...</p>
          </div>
        ) : error ? (
          // Error message shown if API request fails
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : records.length === 0 ? (
          // Empty state when no KYC records are found
          <div className="text-center py-10 text-gray-500">
            No KYC records found.
          </div>
        ) : filteredAndSortedRecords.length === 0 ? (
          // No results state when filters yield no matches
          <div className="text-center py-10 text-gray-500">
            No matching records found.
          </div>
        ) : (
          <>
            {/* Data table displaying KYC records when available */}
            <table className="w-full table-auto border-separate border-spacing-y-2 text-sm">
              {/* Table header with column titles */}
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
              {/* Table body with paginated records */}
              <tbody>
                {currentRecords.map((record) => (
                  <tr key={record._id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 border-b">{record.nic}</td>
                    <td className="px-4 py-3 border-b">{record.recipient}</td>
                    <td className="px-4 py-3 border-b">
                      {formatDate(record.dateSubmitted)}
                    </td>
                    <td className="px-4 py-3 border-b">
                      {/* Pill-style status indicator */}
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
                      {/* Shows review date if available, otherwise shows dash */}
                      {record.reviewed ? formatDate(record.reviewed) : "-"}
                    </td>
                    <td className="px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        {/* NIC Document Download */}
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

                        {/* Person with NIC Download */}
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
                    <td className="px-4 py-3 border-b">
                      {/* Status update action buttons */}
                      <div className="flex items-center gap-2">
                        {/* Approval/rejection buttons - conditionally rendered only for unreviewed records */}
                        {record.status === KYC_STATUSES.NOT_REVIEWED && (
                          <>
                            {/* Approve button - Changes status to "Accepted" */}
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
                            {/* Reject button - Changes status to "Rejected" */}
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

                {/* Page number buttons - improved pagination with ellipsis */}
                {(() => {
                  // Enhanced pagination algorithm with better error handling
                  const renderPageNumbers = () => {
                    const buttons = [];

                    // Handle edge case where totalPages is 0 or undefined
                    if (!totalPages || totalPages <= 0) {
                      return <></>;
                    }

                    // Show all pages if total pages are 7 or fewer
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
                                ? "bg-primary text-white"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      return buttons;
                    }

                    // Complex pagination with ellipsis for more than 7 pages

                    // Always show first page
                    buttons.push(
                      <button
                        key={1}
                        onClick={() => paginate(1)}
                        aria-label="Go to page 1"
                        aria-current={currentPage === 1 ? "page" : undefined}
                        className={`px-3 py-1 border-t border-b ${
                          currentPage === 1
                            ? "bg-primary text-white"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        1
                      </button>
                    );

                    // Calculate range around current page
                    let startPage: number, endPage: number;

                    if (currentPage <= 3) {
                      // Near beginning
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
                            if (pageNum >= totalPages) return null; // Skip if beyond total pages

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
                                    ? "bg-primary text-white"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        ).filter(Boolean) // Remove null entries
                      );

                      // Only show ellipsis if there are more pages
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
                    } else if (currentPage >= totalPages - 2) {
                      // Near end
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
                    } else {
                      // Middle - show ellipsis on both sides
                      buttons.push(
                        <span
                          key="ellipsis1"
                          className="px-3 py-1 border-t border-b"
                        >
                          ...
                        </span>
                      );

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
                                    ? "bg-primary text-white"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )
                      );

                      // Only add second ellipsis if there are pages between endPage and totalPages
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

                    // Always show last page if it's different from first page
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
                              ? "bg-primary text-white"
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

            {/* Records count indicator */}
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
