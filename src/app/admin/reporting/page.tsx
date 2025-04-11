
'use client'

import { FC } from 'react'
import { HiOutlineChatAlt2 } from 'react-icons/hi'
import AdminNavbar from '@/components/Admin/AdminNavbar'
{/*import AdminSidebar from '@/components/Admin/AdminSidebar'*/}

interface Report {
  id: number
  reportedUser: string
  reportedBy: string
  reason: string
  status: 'Resolved' | 'Not Resolved'
}

const reports: Report[] = [
  { id: 1, reportedUser: 'Sam', reportedBy: 'Ram', reason: 'Harassment', status: 'Not Resolved' },
  { id: 2, reportedUser: 'Janu', reportedBy: 'Madona', reason: 'Missed deadline', status: 'Resolved' },
  { id: 3, reportedUser: 'Kile', reportedBy: 'Jin', reason: 'Service issue', status: 'Resolved' },
  { id: 4, reportedUser: 'Sam', reportedBy: 'Ram', reason: 'Harassment', status: 'Not Resolved' },
]

const ReportingPage: FC = () => {
  return (
    <div className="flex h-screen">
      {/*<AdminSidebar />*/}

      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminNavbar />

        <main className="p-6 overflow-auto">
          <h2 className="text-xl font-semibold mb-4">Reporting Table</h2>
          <div className="border rounded-md overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#609ad9] text-white">
                  <th className="px-4 py-2 border">Reported ID</th>
                  <th className="px-4 py-2 border">Reported User</th>
                  <th className="px-4 py-2 border">Reported by</th>
                  <th className="px-4 py-2 border">Reason</th>
                  <th className="px-4 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => (
                  <tr key={idx} className="text-center">
                    <td className="border px-4 py-2">{report.id}</td>
                    <td className="border px-4 py-2 flex items-center justify-center gap-1">
                      {report.reportedUser}
                      <HiOutlineChatAlt2 className="w-4 h-4 text-gray-500" />
                    </td>
                    <td className="border px-4 py-2 flex items-center justify-center gap-1">
                      {report.reportedBy}
                      <HiOutlineChatAlt2 className="w-4 h-4 text-gray-500" />
                    </td>
                    <td className="border px-4 py-2">{report.reason}</td>
                    <td
                      className={`border px-4 py-2 font-semibold ${
                        report.status === 'Resolved' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {report.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ReportingPage
