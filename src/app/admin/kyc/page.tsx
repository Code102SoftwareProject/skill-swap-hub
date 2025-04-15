// Import data-fetching function and download icon
import { fetchKYCRecords } from "../../../lib/actions"; 
import { FaDownload } from "react-icons/fa";
import AdminNavbar from '@/components/Admin/AdminNavbar'
import AdminSidebar from '@/components/Admin/AdminSidebar'

// Async server component for the KYC page
export default async function AdminKYCPage() {

  // Fetch KYC records from MongoDB using a server action
  const records = await fetchKYCRecords();

  return (
    <div className="flex h-screen">
    <AdminSidebar />

     <div className="flex flex-col flex-1 overflow-hidden">
       <AdminNavbar />
      
    <main className="p-6 bg-gray-100 min-h-screen">
      {/* Page heading */}
      <h1 className="text-2xl font-semibold text-[#0077b6] mb-6">
        Admin Dashboard - KYC
      </h1>

      {/* Table container with shadow and rounded borders */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm table-auto border border-gray-300">
          {/* Table header */}
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="p-3 text-left">NIC No</th>
              <th className="p-3 text-left">Recipient</th>
              <th className="p-3 text-left">Date Submitted</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Reviewed</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          {/* Table body with dynamic rows */}
          <tbody>
            {records.map((rec: any) => (
              <tr key={rec._id} className="border-t hover:bg-gray-50">
                {/* NIC No */}
                <td className="p-3">{rec.nic}</td>

                {/* Recipient name */}
                <td className="p-3">{rec.recipient}</td>

                {/* Submission date */}
                <td className="p-3">{rec.dateSubmitted}</td>

                {/* Status with colored dot */}
                <td className="p-3">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      rec.status === "Accepted"
                        ? "text-green-600"
                        : rec.status === "Rejected"
                        ? "text-red-600"
                        : rec.status === "Signed"
                        ? "text-blue-600"
                        : "text-gray-800"
                    }`}
                  >
                    {/* Colored circle based on status */}
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rec.status === "Accepted"
                          ? "bg-green-500"
                          : rec.status === "Rejected"
                          ? "bg-red-500"
                          : rec.status === "Signed"
                          ? "bg-blue-500"
                          : "bg-black"
                      }`}
                    ></span>
                    {rec.status}
                  </span>
                </td>

                {/* Reviewed time (e.g., '10 minutes ago') */}
                <td className="p-3">{rec.reviewed}</td>

                {/* Download icon as an action */}
                <td className="p-3">
                  <FaDownload className="cursor-pointer hover:text-blue-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional note about number of records */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {records.length} of {records.length} users
      </div>
    </main>
    </div>
    </div>
  );
}
