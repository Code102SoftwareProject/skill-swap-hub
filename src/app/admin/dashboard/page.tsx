'use client'; // Required for client-side rendering

import { useState } from 'react';
import AdminSidebar from '@/components/Admin/AdminSidebar';
import AdminNavbar from '@/components/Admin/AdminNavbar';

import DashboardContent from '@/components/Admin/dashboardContent/DashboardContent';
import KYCContent from '@/components/Admin/dashboardContent/KYCContent';
import UsersContent from '@/components/Admin/dashboardContent/UsersContent';
import SuggestionsContent from '@/components/Admin/dashboardContent/SuggestionsContent';
import SystemContent from '@/components/Admin/dashboardContent/SystemContent';
import VerifyDocumentsContent from '@/components/Admin/dashboardContent/VerifyDocumentsContent';
import ReportingContent from '@/components/Admin/dashboardContent/ReportingContent';

export default function AdminDashboardPage() {
  const [activeComponent, setActiveComponent] = useState('dashboard');

  // Function to return the right component based on selected tab
  const renderContent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <DashboardContent />;
      case 'kyc':
        return <KYCContent />;
      case 'users':
        return <UsersContent />;
      case 'suggestions':
        return <SuggestionsContent />;
      case 'system':
        return <SystemContent />;
      case 'verify-documents':
        return <VerifyDocumentsContent />;
      case 'reporting':
        return <ReportingContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar with navigation */}
      <AdminSidebar
        onNavigate={setActiveComponent}
        activeComponent={activeComponent}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminNavbar />
        <main className="p-6 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
