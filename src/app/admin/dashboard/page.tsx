'use client'; // Required for client-side rendering

import { useState } from 'react';
import AdminSidebar from '@/components/Admin/AdminSidebar';
import AdminNavbar from '@/components/Admin/AdminNavbar';

import DashboardContent from '@/components/Admin/dashboardContent/DashboardContent';
import KYCContent from '@/components/Admin/dashboardContent/KYCContent';
import UsersContent from '@/components/Admin/dashboardContent/UsersContent';
import SuggestionsContent from '@/components/Admin/dashboardContent/SuggestionsContent';
import SystemContent from '@/components/Admin/dashboardContent/SystemContent';
import VerificationRequests from '@/components/Admin/skillverifications';
import ReportingContent from '@/components/Admin/dashboardContent/ReportingContent';

export default function AdminDashboardPage() {
  const [activeComponent, setActiveComponent] = useState('dashboard');

  // Function to return the right component based on selected tab
  const renderContent = () => {
    console.log('Rendering:', activeComponent);
    switch (activeComponent) {
      case 'dashboard':
        return <DashboardContent key={activeComponent} />;
      case 'kyc':
        return <KYCContent key={activeComponent} />;
      case 'users':
        return <UsersContent key={activeComponent} />;
      case 'suggestions':
        return <SuggestionsContent key={activeComponent} />;
      case 'system':
        return <SystemContent key={activeComponent} />;
      case 'verify-documents':
        return <VerificationRequests userId='user123' key={activeComponent} />;
      case 'reporting':
        return <ReportingContent key={activeComponent} />;
      default:
        return <DashboardContent key={activeComponent} />;
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
        <main className="p-6 mt-4 overflow-y-auto bg-gray-50 min-h-screen">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}
