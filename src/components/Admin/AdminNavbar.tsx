'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/admin">
          <span className="text-xl font-bold cursor-pointer">Admin Panel</span>
        </Link>

        <div className="md:hidden">
          <button onClick={toggleMenu} className="focus:outline-none">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="hidden md:flex space-x-6">
          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link href="/logout">Logout</Link>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link href="/admin/dashboard" className="block">Dashboard</Link>
          <Link href="/admin/users" className="block">Users</Link>
          <Link href="/admin/settings" className="block">Settings</Link>
          <Link href="/logout" className="block">Logout</Link>
        </div>
      )}
    </nav>
  );
}
