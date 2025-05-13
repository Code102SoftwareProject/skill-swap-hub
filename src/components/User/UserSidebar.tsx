'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';

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
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import clsx from 'clsx'; // Utility for conditional class names

// Define props for conditional rendering
interface UserSidebarProps {
    onNavigate: (component: string) => void;  // Function passed from parent to switch the view
    activeComponent: string; // Current active component ID
}

const menuItems = [
  {id:'dashboard', icon: Home, label: 'Dashboard'},
  { id:'myskill',icon: Award, label: 'My Skills' },
  { id:'listings',icon: List, label: 'Listings' },
  { id:'matches',icon: Users, label: 'Matches'},
  { id:'meeting',icon: Calendar, label: 'Meetings' },
  { id:'sessions',icon: Clock, label: 'Sessions' },
  { id:'skillVerify',icon: CheckSquare, label: 'Skill Verify' },
  { id:'suggestions',icon: Lightbulb, label: 'Suggestions' },
  { id:'setting',icon: Settings, label: 'Settings' },
];

const Sidebar: FC<UserSidebarProps> = ({ onNavigate, activeComponent }) => {
  const { logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col pt-16 md:pt-28">
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeComponent === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={clsx(
                    'flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors border-l-4',
                    isActive
                      ? 'text-blue-600 bg-blue-50 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 border-transparent'
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-5 h-5 mr-3',
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
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