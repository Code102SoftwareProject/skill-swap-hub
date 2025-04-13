'use client'; // ✅ Required because we're using usePathname(), which is a client-side hook

import { FC } from 'react'
import {
  HiOutlineHome,
  HiOutlineIdentification,
  HiOutlineUser,
  HiOutlineLightBulb,
  HiOutlineCog,
  HiOutlineDocumentText,
  HiOutlineFlag,
  HiOutlineLogout,
} from 'react-icons/hi'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

// 🧭 Navigation items with label, route path, and corresponding icon
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: HiOutlineHome },
  { label: 'KYC', href: '/kyc', icon: HiOutlineIdentification },
  { label: 'Users', href: '/users', icon: HiOutlineUser },
  { label: 'Suggestions', href: '/suggestions', icon: HiOutlineLightBulb },
  { label: 'System', href: '/system', icon: HiOutlineCog },
  { label: 'Verify Documents', href: '/verify-documents', icon: HiOutlineDocumentText },
  { label: 'Reporting', href: '/reporting', icon: HiOutlineFlag },
]

const AdminSidebar: FC = () => {
  // 📍 Get the current pathname (e.g., "/admin/users")
  const rawPathname = usePathname()

  // 🧹 Strip out "/admin" prefix so matching works with nav item paths
  const pathname = rawPathname.replace(/^\/admin/, '')

  return (
    <aside className="w-56 h-screen bg-white flex flex-col justify-between border-r border-gray-200 pt-28">
      
      {/* 🔝 Top part of the sidebar with nav links */}
      <div className="flex flex-col w-full">
        {navItems.map((item) => {
          const Icon = item.icon
          
          // ✅ Check if the current route starts with this nav item path
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center w-full px-4 py-3 border-l-4 transition-all duration-200',
                isActive
                  ? 'bg-primary text-white border-blue-600' // 🎯 Active styling
                  : 'text-gray-500 hover:bg-gray-100 border-transparent' // 🧍 Default styling
              )}
            >
              {/* 📌 Icon with color depending on active state */}
              <Icon className={clsx('w-5 h-5 mr-3', isActive ? 'text-white' : 'text-gray-400')} />

              {/* 🔤 Link label */}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* 🔚 Bottom part of the sidebar with a Sign Out button */}
      <div className="mt-auto border-t border-gray-200">
        <button className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-gray-100">
          <HiOutlineLogout className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
