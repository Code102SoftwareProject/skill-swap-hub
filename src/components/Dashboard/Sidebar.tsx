'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Award, 
  List, 
  Users, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Lightbulb, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

const Sidebar = () => {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Award, label: 'My Skills', path: '/dashboard/skills' },
    { icon: List, label: 'Listings', path: '/dashboard/listings' },
    { icon: Users, label: 'Matches', path: '/dashboard/matches' },
    { icon: Calendar, label: 'Meetings', path: '/dashboard/meetings' },
    { icon: Clock, label: 'Sessions', path: '/dashboard/sessions' },
    { icon: CheckSquare, label: 'Skill Verify', path: '/dashboard/skill-verify' },
    { icon: Lightbulb, label: 'Suggestions', path: '/dashboard/suggestions' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className="w-64 bg-white h-full border-r border-gray-200 flex flex-col">
      

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.path) 
                    ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;