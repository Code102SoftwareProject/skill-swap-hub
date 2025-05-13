'use client';

import { useState, useEffect } from 'react';
import UserSidebar from '@/components/User/UserSidebar';
import NavBar from '@/components/Navbar';
import { Menu } from 'lucide-react';

import UserDashboardContent from '@/components/User/DashboardContent/UserDashboardContent';
import MySkillsContent from '@/components/User/DashboardContent/MySkillsContent';
import ListingsContent from '@/components/User/DashboardContent/ListingsContent';
import MatchesContent from '@/components/User/DashboardContent/MatchesContent';
import MeetingContent from '@/components/User/DashboardContent/MeetingContent';
import SessionsContent from '@/components/User/DashboardContent/SessionsContent';
import SkillVerifyContent from '@/components/User/SkillVerificationPortal';
import SuggestionContent from '@/components/User/DashboardContent/SuggestionContent';
import SettingContent from '@/components/User/DashboardContent/SettingContent';

export default function UserDashboardPage() {
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Load from localStorage when the component mounts
  useEffect(() => {
    const savedComponent = localStorage.getItem('activeComponent');
    if (savedComponent) {
      setActiveComponent(savedComponent);
    }
    
    // Check if we're in mobile view
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setIsSidebarOpen(!isMobileView); // Close sidebar by default on mobile
    };
    
    // Run on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save to localStorage when activeComponent changes
  useEffect(() => {
    localStorage.setItem('activeComponent', activeComponent);
  }, [activeComponent]);

  const handleNavigate = (component: string) => {
    setActiveComponent(component);
    // Close sidebar automatically on mobile after navigation
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <UserDashboardContent key={activeComponent} />;
      case 'myskill':
        return <MySkillsContent key={activeComponent} />;
      case 'listings':
        return <ListingsContent key={activeComponent} />;
      case 'matches':
        return <MatchesContent key={activeComponent} />;
      case 'meeting':
        return <MeetingContent key={activeComponent} />;
      case 'sessions':
        return <SessionsContent key={activeComponent} />;
      case 'skillVerify':
        return <SkillVerifyContent key={activeComponent} />;
      case 'suggestions':
        return <SuggestionContent key={activeComponent} />;
      case 'setting':
        return <SettingContent key={activeComponent} />;
      default:
        return <UserDashboardContent key={activeComponent} />;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <NavBar />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`${isMobile ? (isSidebarOpen ? 'block' : 'hidden') : 'block'}`}>
          <UserSidebar
            onNavigate={handleNavigate}
            activeComponent={activeComponent}
          />
        </div>
        
        {/* Main content */}
        <main className={`flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 ${isMobile && isSidebarOpen ? 'hidden md:block' : 'block'}`}>
          {/* Mobile toggle button - visible at top of content on mobile */}
          {isMobile && !isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden mb-4 flex items-center text-gray-600 hover:text-blue-600"
            >
              <Menu className="h-5 w-5 mr-2" />
              <span>Menu</span>
            </button>
          )}
          
          {renderContent()}
        </main>
      </div>
    </div>
  );
}