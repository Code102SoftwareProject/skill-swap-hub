'use client'; // Required for using client-side hooks (e.g., useState, useRouter)

// Importing React & Next modules
import { FC } from 'react';
import { useRouter } from 'next/navigation'; // Next.js router for navigation

//Importing Lucide icons
import {
  Home,
  IdCard,
  Users,
  Lightbulb,
  Settings,
  FileText,
  Flag,
  LogOut,
} from 'lucide-react'; 

import clsx from 'clsx'; // Utility for conditional class names

// Define props for conditional rendering
interface AdminSidebarProps {
  onNavigate: (component: string) => void;  // Function passed from parent to switch the view
  activeComponent: string; // Current active component ID
}

// Navigation items config
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'kyc', label: 'KYC', icon: IdCard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
  { id: 'system', label: 'System', icon: Settings },
  { id: 'verify-documents', label: 'Verify Documents', icon: FileText },
  { id: 'reporting', label: 'Reporting', icon: Flag },
];

// Component
const AdminSidebar: FC<AdminSidebarProps> = ({
  onNavigate,
  activeComponent,
}) => {
  const router = useRouter(); // Currently not used for navigation, but imported if needed later

  // Sign out logic
  const handleLogout = () => {
    onNavigate('logout')
  };

  return (
    <aside className="w-56 h-screen bg-white flex flex-col justify-between border-r border-gray-200 pt-28">
      
      {/* Navigation Section (conditionally rendered) */}
      <div className="flex flex-col w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeComponent === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}  //  Trigger component switch
              className={clsx(
                'flex items-center w-full px-4 py-3 border-l-4 transition-all duration-200',
                isActive
                  ? 'bg-primary text-white border-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 border-transparent'
              )}
            >
              <Icon
                className={clsx(
                  'w-5 h-5 mr-3',
                  isActive ? 'text-white' : 'text-gray-400'
                )}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Logout Button (conditionally rendered) */}
      <div className="mt-auto border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
