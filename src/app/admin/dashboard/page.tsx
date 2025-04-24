'use client';

import { useEffect, useState } from 'react';
import AdminNavbar from "@/components/Admin/AdminNavbar";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import { CardWithBar } from "@/components/Dashboard/SkillsRequested";
import { CardWithChart } from "@/components/Dashboard/TimeSpentChart";
import KYCContent from "@/components/Admin/dashboardContent/KYCContent";

type DashboardData = {
  activeUsers: number;
  totalSessions: number;
  popularSkill: string;
  totalSkillsOffered: number;
  totalSkillsRequested: number;
  matches: number;
};

type AdminSidebarProps = {
  // Existing properties
  onNavigate: (component: string) => void;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeComponent, setActiveComponent] = useState('dashboard');

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to fetch dashboard data", err));
  }, []);

  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard title="Active Users" value={data?.activeUsers || 0} />
              <StatCard title="No of Sessions" value={data?.totalSessions || 0} />
              <StatCard title="Popular Skill" value={data?.popularSkill || ''} />
              <StatCard title="Skills Offered" value={data?.totalSkillsOffered || 0} />
              <StatCard title="Skills Requested" value={data?.totalSkillsRequested || 0} />
              <StatCard title="Total Matches" value={data?.matches || 0} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardWithChart />
              <CardWithBar />
            </div>
          </div>
        );
      case 'kyc':
        return <KYCContent />;
      case 'users':
        return <div className="p-6">Users Management Component</div>;
      case 'suggestions':
        return <div className="p-6">Suggestions Component</div>;
      case 'system':
        return <div className="p-6">System Settings Component</div>;
      case 'verify-documents':
        return <div className="p-6">Document Verification Component</div>;
      case 'reporting':
        return <div className="p-6">Reporting Component</div>;
      default:
        return <div className="p-6">Select a component from the sidebar</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar 
        onNavigate={setActiveComponent} 
        activeComponent={activeComponent}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto">
          {renderComponent()}
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
