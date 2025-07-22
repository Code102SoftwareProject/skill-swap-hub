'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import UserSidebar from '@/components/User/UserSidebar';
import NavBar from '@/components/homepage/Navbar';

import UserDashboardContent from '@/components/User/DashboardContent/UserDashboardContent';
import MySkillsContent from '@/components/User/DashboardContent/MySkillsContent';
import ListingsContent from '@/components/User/DashboardContent/ListingsContent';
import MatchesContent from '@/components/User/DashboardContent/MatchesContent';
import MeetingContent from '@/components/User/DashboardContent/MeetingContent';
import SessionsContent from '@/components/User/DashboardContent/SessionsContent';
import SkillVerifyContent from '@/components/User/SkillVerificationPortal';
import SuggestionContent from '@/components/User/DashboardContent/SuggestionContent';
import SettingContent from '@/components/User/DashboardContent/SettingContent';
import { FeedbackForm } from '@/components/Dashboard/feedback/FeedbackForm';

import ReviewsContent from '@/components/Dashboard/ReviewsContent';


function UserDashboardPageContent() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Load from URL parameters or localStorage when the component mounts
  useEffect(() => {
    const componentParam = searchParams.get('component');
    if (componentParam) {
      setActiveComponent(componentParam);
    } else {
      const savedComponent = localStorage.getItem('activeComponent');
      if (savedComponent) {
        setActiveComponent(savedComponent);
      }
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
  }, [searchParams]);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return (
    <UserDashboardContent
      key={activeComponent}
      onNavigateToMySkills={() => setActiveComponent('myskill')}
      onNavigateToReviews={() => setActiveComponent('reviews')}
    />
  );
      case 'myskill':
        return <MySkillsContent key={activeComponent} />;
      case 'listings':
        return <ListingsContent key={activeComponent} onNavigateToSkills={() => setActiveComponent('myskill')} />;
      case 'matches':
        return <MatchesContent key={activeComponent} />;
      case 'meeting':
        return <MeetingContent key={activeComponent} />;
      case 'sessions':
        return <SessionsContent key={activeComponent} />;
      case 'skillVerify':
        return <SkillVerifyContent key={activeComponent} />;
      case 'suggestions':
        return <SuggestionContent key={activeComponent} onNavigateToFeedback={() => setActiveComponent('feedback')} />;
      case 'setting':
        return <SettingContent key={activeComponent} />;
      case 'feedback':
        return <FeedbackForm userId={user?._id || ''} key={activeComponent} />;
       case 'reviews':  // Add this new case
      return <ReviewsContent key={activeComponent} />;
      default:
        return (
          <UserDashboardContent
            key={activeComponent}
            onNavigateToMySkills={() => setActiveComponent('myskill')}
            onNavigateToReviews={() => setActiveComponent('reviews')}
          />
        );
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="h-screen flex flex-col">
        <NavBar onSidebarToggle={toggleSidebar} showSidebarToggle={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="h-screen flex flex-col">
        <NavBar onSidebarToggle={toggleSidebar} showSidebarToggle={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <NavBar onSidebarToggle={toggleSidebar} showSidebarToggle={isMobile} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Dark overlay when sidebar is open on mobile */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`${isMobile ? (isSidebarOpen ? 'block' : 'hidden') : 'block'} ${isMobile ? 'fixed z-40 left-0 top-0 h-full' : ''}`}>
          <UserSidebar
            onNavigate={handleNavigate}
            activeComponent={activeComponent}
            isMobile={isMobile}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

/**
 * Main UserDashboardPage component with Suspense boundary for useSearchParams
 */
export default function UserDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    }>
      <UserDashboardPageContent />
    </Suspense>
  );
}