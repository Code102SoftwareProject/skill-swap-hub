"use client";

import { FaDownload } from "react-icons/fa";
import { useState } from "react";
import { BsCircleFill } from "react-icons/bs";

type StatusType = "Unread" | "Rejected" | "Accepted" | "Signed";

const dummyRecords = [
  { nic: "200078781232", recipient: "Silv Rogers", dateSubmitted: "2023-10-09", status: "Unread", reviewed: "-" },
  { nic: "200134687985", recipient: "Donna Prince", dateSubmitted: "2023-02-10", status: "Rejected", reviewed: "a week ago" },
  // ...existing records...
];

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

export default function KYCContent() {
  const [records, setRecords] = useState(dummyRecords);
  const [sortStatus, setSortStatus] = useState("All");

  const filterRecords = records.filter((rec) => {
    return sortStatus === "All" || rec.status === sortStatus;
  });

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
            <option value="Unread">Unread</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Signed">Signed</option>
          </select>
        </div>

        {/* Table content */}
        <table className="w-full table-auto border-separate border-spacing-y-2 text-sm">
          {/* ...existing table header and body code... */}
          {/* Copy the entire table content from the original KYC page */}
        </table>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div>Showing {filterRecords.length} of {records.length} users</div>
          <div className="flex items-center gap-4">
            <button className="text-blue-500 hover:underline">Prev</button>
            <span className="font-bold text-black">1</span>
            <button className="text-blue-500 hover:underline">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}