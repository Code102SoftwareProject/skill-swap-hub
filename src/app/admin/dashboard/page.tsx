'use client';

import { useEffect, useState } from 'react';

import AdminNavbar from "@/components/Admin/AdminNavbar";
import AdminSidebar from "@/components/Admin/AdminSidebar";

type DashboardData = {
  activeUsers: number;
  totalSessions: number;
  popularSkill: string;
  totalSkillsOffered: number;
  totalSkillsRequested: number;
  matches: number;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to fetch dashboard data", err));
  }, []);

  if (!data) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Navbar */}
        <AdminNavbar />

        <div className="p-6 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard title="Active Users" value={`${data.activeUsers}/80`} />
            <StatCard title="No of Sessions" value={data.totalSessions} />
            <StatCard title="Popular Skill" value={data.popularSkill} />
            <StatCard title="No of Skills Offered" value={data.totalSkillsOffered} />
            <StatCard title="No of Skills Requested" value={data.totalSkillsRequested} />
            <StatCard title="No of Match" value={data.matches} />
          </div>

          {/* Placeholder for chart components */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-md font-semibold mb-2">No of Active Users over time</h2>
              <div className="h-48 bg-gradient-to-b from-blue-300 to-blue-100 rounded-md shadow-inner flex items-center justify-center">
                <p className="text-gray-600 italic">Line Chart Placeholder</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-md font-semibold mb-2">Skills Requested</h2>
              <div className="h-48 bg-blue-50 rounded-md flex items-center justify-center">
                <p className="text-gray-600 italic">Bar Chart Placeholder</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="text-md font-semibold mb-2">Skills Offered</h2>
              <div className="h-48 bg-blue-50 rounded-md flex items-center justify-center">
                <p className="text-gray-600 italic">Bar Chart Placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="p-4 bg-blue-100 rounded shadow-md">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <p className="text-xl font-semibold text-blue-900">{value}</p>
    </div>
  );
}
