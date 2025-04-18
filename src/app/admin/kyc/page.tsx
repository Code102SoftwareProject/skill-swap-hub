// Import required components and utilities
import { fetchKYCRecords } from "../../../lib/actions";
import { FaDownload } from "react-icons/fa";
import AdminNavbar from "@/components/Admin/AdminNavbar";
import AdminSidebar from "@/components/Admin/AdminSidebar";

export default async function AdminKYCPage() {
  const records = await fetchKYCRecords();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar */}
        <AdminNavbar />

        {/* Page Content */}
        <main className="p-6 bg-gray-100 min-h-screen">
          <h1 className="text-2xl font-semibold text-[#0077b6] mb-6">
            Admin Dashboard - KYC
          </h1>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm table-auto border border-gray-300">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="p-3 text-left">NIC No</th>
                  <th className="p-3 text-left">Recipient</th>
                  <th className="p-3 text-left">Date Submitted</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Reviewed</th>
                  <th className="p-3 text-left">Document</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500">
                      No KYC records found.
                    </td>
                  </tr>
                ) : (
                  records.map((rec: any) => (
                    <tr key={rec._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{rec.nic}</td>
                      <td className="p-3">{rec.recipient}</td>
                      <td className="p-3">{rec.dateSubmitted}</td>

                      {/* Editable Status */}
                      <td className="p-3">
                        <form
                          action="/api/kyc/update-status"
                          method="POST"
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="id" value={rec._id} />
                          <select
                            name="status"
                            defaultValue={rec.status}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="Not Reviewed">Not Reviewed</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          <button
                            type="submit"
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Save
                          </button>
                        </form>
                      </td>

                      <td className="p-3">{rec.reviewed}</td>

                      {/* Download icon */}
                      <td className="p-3">
                        {rec.documentURL ? (
                          <a
                            href={`/api/file/retreive?fileUrl=${encodeURIComponent(rec.documentURL)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download KYC Document"
                          >
                            <FaDownload className="cursor-pointer hover:text-blue-500" />
                          </a>
                        ) : (
                          <FaDownload className="text-gray-400 cursor-not-allowed" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {records.length} of {records.length} users
          </div>
        </main>
      </div>
    </div>
  );
}
