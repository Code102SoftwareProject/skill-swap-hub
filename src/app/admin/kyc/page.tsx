"use client"; // Enables client-side features like useState in this file

// ------------------ Imports ------------------
import AdminNavbar from "@/components/Admin/AdminNavbar"; // Top navigation bar component
import AdminSidebar from "@/components/Admin/AdminSidebar"; // Sidebar component
import { FaDownload } from "react-icons/fa"; // Download icon
import { useState } from "react"; // React state management
import { BsCircleFill } from "react-icons/bs"; // Circle icon used for status indicator

// ------------------ Type Definitions ------------------
type StatusType = "Unread" | "Rejected" | "Accepted" | "Signed";

// ------------------ Dummy Data ------------------
// Replace this later with data from MongoDB or an API
const dummyRecords: {
  nic: string;           // NIC number of the user
  recipient: string;     // Admin who handles the request
  dateSubmitted: string; // Date of submission
  status: StatusType;    // Current status of the request
  reviewed: string;      // Human-readable status time
}[] = [
  { nic: "200078781232", recipient: "Silv Rogers", dateSubmitted: "2023-10-09", status: "Unread", reviewed: "-" },
  { nic: "200134687985", recipient: "Donna Prince", dateSubmitted: "2023-02-10", status: "Rejected", reviewed: "a week ago" },
  { nic: "200345267043", recipient: "Silv Rogers", dateSubmitted: "2023-12-04", status: "Accepted", reviewed: "16 minutes ago" },
  { nic: "200567754052", recipient: "Donna Prince", dateSubmitted: "2022-03-05", status: "Accepted", reviewed: "1 year ago" },
  { nic: "200552466876", recipient: "Silv Rogers", dateSubmitted: "2023-03-07", status: "Accepted", reviewed: "15 minutes ago" },
  { nic: "200745443443", recipient: "Donna Prince", dateSubmitted: "2023-09-07", status: "Accepted", reviewed: "10 minutes ago" },
  { nic: "897654324V", recipient: "Silv Rogers", dateSubmitted: "2023-03-10", status: "Rejected", reviewed: "a week ago" },
  { nic: "198654634345", recipient: "Jane", dateSubmitted: "2023-03-18", status: "Signed", reviewed: "40 minutes ago" },
];

// ------------------ Styling Maps ------------------
// Maps to assign Tailwind classes based on status
const statusColorMap = {
  Unread: "text-black",
  Rejected: "text-red-600",
  Accepted: "text-green-600",
  Signed: "text-blue-600",
};

const dotColorMap = {
  Unread: "bg-black",
  Rejected: "bg-red-500",
  Accepted: "bg-green-500",
  Signed: "bg-blue-500",
};

// ------------------ Main Component ------------------
export default function KYCClientTable() {
  // State to hold all KYC records (used for filtering & updating status)
  const [records, setRecords] = useState(dummyRecords);

  // State to filter records by status
  const [sortStatus, setSortStatus] = useState("All");

  // Filter logic: show all or records that match selected status
  const filterRecords = records.filter((rec) => {
    return sortStatus === "All" || rec.status === sortStatus;
  });

  return (
    <div className="flex h-screen">
      {/* Sidebar on the left */}
      <AdminSidebar />

      {/* Main content section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation bar */}
        <AdminNavbar />

        {/* Main page content */}
        <main className="p-6 bg-gray-100 min-h-screen">
          {/* Page heading */}
          <h1 className="text-2xl font-semibold text-[#0077b6] mb-6">Admin Dashboard - KYC</h1>

          {/* Table card container */}
          <div className="bg-white rounded-lg shadow p-6">

            {/* Dropdown filter for status */}
            <div className="flex justify-start items-center gap-4 mb-4">
              <select
                className="border px-4 py-2 rounded"
                value={sortStatus}
                onChange={(e) => setSortStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Unread">Unread</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Signed">Signed</option>
              </select>
            </div>

            {/* Table starts here */}
            <table className="w-full table-auto border-separate border-spacing-y-2 text-sm">
              {/* Table header */}
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2">NIC no</th>
                  <th className="px-4 py-2">Recipient</th>
                  <th className="px-4 py-2">Date Submitted</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Reviewed</th>
                  <th className="px-4 py-2 text-center">Download</th>
                </tr>
              </thead>

              {/* Table body */}
              <tbody>
                {/* Show message if no matching records */}
                {filterRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-400">
                      No records found for selected filter.
                    </td>
                  </tr>
                )}

                {/* Loop through each record */}
                {filterRecords.map((rec, i) => (
                  <tr key={i} className="bg-white hover:bg-gray-50">
                    {/* NIC number */}
                    <td className="px-4 py-2">{rec.nic}</td>

                    {/* Assigned recipient/admin */}
                    <td className="px-4 py-2">{rec.recipient}</td>

                    {/* Submission date */}
                    <td className="px-4 py-2">{rec.dateSubmitted}</td>

                    {/* Status: Editable dropdown only for "Unread" */}
                    <td className="px-4 py-2">
                      {rec.status === "Unread" ? (
                        // Editable dropdown to change status
                        <select
                          className="border px-2 py-1 rounded text-sm"
                          value={rec.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as StatusType;

                            // Update selected record status in state
                            setRecords((prev) =>
                              prev.map((r) =>
                                r.nic === rec.nic ? { ...r, status: newStatus } : r
                              )
                            );
                          }}
                        >
                          <option value="Unread">Unread</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      ) : (
                        // For other statuses, show colored dot and label
                        <div className="flex items-center gap-1">
                          <BsCircleFill className={`w-2 h-2 ${dotColorMap[rec.status]}`} />
                          <span className={`${statusColorMap[rec.status]}`}>{rec.status}</span>
                        </div>
                      )}
                    </td>

                    {/* Reviewed time */}
                    <td className="px-4 py-2">{rec.reviewed}</td>

                    {/* Download icon (not functional yet) */}
                    <td className="px-4 py-2 text-center">
                      <FaDownload className="text-gray-600 hover:text-blue-500 cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer pagination (not functional yet) */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <div>Showing {filterRecords.length} of {records.length} users</div>
              <div className="flex items-center gap-4">
                <button className="text-blue-500 hover:underline">Prev</button>
                <span className="font-bold text-black">1</span>
                <button className="text-blue-500 hover:underline">Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
