'use client'; // ✅ Required because we're using client-side hooks

import { FC } from 'react';
import {
  HiOutlineHome,
  HiOutlineIdentification,
  HiOutlineUser,
  HiOutlineLightBulb,
  HiOutlineCog,
  HiOutlineDocumentText,
  HiOutlineFlag,
  HiOutlineLogout,
} from 'react-icons/hi';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // 🧭 Include useRouter
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: HiOutlineHome },
  { label: 'KYC', href: '/kyc', icon: HiOutlineIdentification },
  { label: 'Users', href: '/users', icon: HiOutlineUser },
  { label: 'Suggestions', href: '/suggestions', icon: HiOutlineLightBulb },
  { label: 'System', href: '/system', icon: HiOutlineCog },
  { label: 'Verify Documents', href: '/verify-documents', icon: HiOutlineDocumentText },
  { label: 'Reporting', href: '/reporting', icon: HiOutlineFlag },
];

const AdminSidebar: FC = () => {
  const router = useRouter(); // 🧭 For navigating after sign out
  const rawPathname = usePathname();
  const pathname = rawPathname.replace(/^\/admin/, '');

  // ✅ Handle logout logic
  const handleLogout = () => {
    // 🚫 Optionally: Clear token cookie/client state here

    // 🔁 Redirect to login page
    router.push('/admin/login');
  };

  return (
    <aside className="w-56 h-screen bg-white flex flex-col justify-between border-r border-gray-200 pt-28">
      
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
              <Icon className={clsx('w-5 h-5 mr-3', isActive ? 'text-white' : 'text-gray-400')} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 🔚 Sign out button with redirection */}
      <div className="mt-auto border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-gray-100"
        >
          <HiOutlineLogout className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
