'use client';

import { useState, useEffect } from 'react';
import UserSidebar from '@/components/User/UserSidebar';
import UserNavBar from '@/components/User/UserNavBar';

import UserDashboardContent from '@/components/User/DashboardContent/UserDashboardContent';
import MySkillsContent from '@/components/User/DashboardContent/MySkillsContent';
import ListingsContent from '@/components/User/DashboardContent/ListingsContent';
import MatchesContent from '@/components/User/DashboardContent/MatchesContent';
import MeetingContent from '@/components/User/DashboardContent/MeetingContent';
import SessionsContent from '@/components/User/DashboardContent/SessionsContent';
import SkillVerifyContent from '@/components/User/DashboardContent/SkillVerifyContent';
import SuggestionContent from '@/components/User/DashboardContent/SuggestionContent';
import SettingContent from '@/components/User/DashboardContent/SettingContent';

export default function UserDashboardPage() {
  const [activeComponent, setActiveComponent] = useState('dashboard');

  // Load from localStorage when the component mounts
  useEffect(() => {
    const savedComponent = localStorage.getItem('activeComponent');
    if (savedComponent) {
      setActiveComponent(savedComponent);
    }
  }, []);

  // Save to localStorage when activeComponent changes
  useEffect(() => {
    localStorage.setItem('activeComponent', activeComponent);
  }, [activeComponent]);

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
      <UserNavBar />
      <div className="flex flex-1 overflow-hidden">
        <UserSidebar
          onNavigate={setActiveComponent}
          activeComponent={activeComponent}
        />
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
