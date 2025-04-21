'use client'; // Required for using client-side hooks

import { FC } from 'react';
import {
  Home,
  IdCard,
  Users,
  Lightbulb,
  Settings,
  FileText,
  Flag,
  LogOut,
} from 'lucide-react'; // Lucide icons
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';

// Define props for conditional rendering
interface AdminSidebarProps {
  showNavItems?: boolean;
  showLogout?: boolean;
}

// Navigation items config
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'KYC', href: '/kyc', icon: IdCard },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Suggestions', href: '/suggestions', icon: Lightbulb },
  { label: 'System', href: '/system', icon: Settings },
  { label: 'Verify Documents', href: '/verify-documents', icon: FileText },
  { label: 'Reporting', href: '/reporting', icon: Flag },
];

// Component
const AdminSidebar: FC<AdminSidebarProps> = ({
  showNavItems = true, // default = show all
  showLogout = true,
}) => {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = rawPathname.replace(/^\/admin/, '');

  // Sign out logic
  const handleLogout = () => {
    router.push('/admin/login');
  };

  return (
    <aside className="w-56 h-screen bg-white flex flex-col justify-between border-r border-gray-200 pt-28">
      
      {/* Navigation Section (conditionally rendered) */}
      {showNavItems && (
        <div className="flex flex-col w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
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
              </Link>
            );
          })}
        </div>
      )}

      {/* Logout Button (conditionally rendered) */}
      {showLogout && (
        <div className="mt-auto border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;
