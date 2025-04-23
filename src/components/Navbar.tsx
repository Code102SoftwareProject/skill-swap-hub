'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, MessageSquare, ChevronDown, Search, LogOut, User } from 'lucide-react';
import SearchPopup from './SearchPopup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    router.push('/dashboard');
  };

  const handleNotificationsClick = () => {
    router.push('/user/notification');
  };

  const isLoggedIn = !!user;
  const displayName = user ? user.firstName : 'User';
  const userImage = '/Avatar.png';

  return (
    <>
      {/* Fixed height navbar with h-16 */}
      <nav className="bg-[#006699] px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="w-10">
          <Link href="/">
            <div className="w-8 h-8">
              <Image
                src="/logo.png"
                alt="SkillSwap Hub"
                width={32}
                height={32}
                className="text-white"
              />
            </div>
          </Link>
        </div>

        {/* Search - perfectly centered */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for skills"
              className="w-full h-10 px-4 py-2 rounded-md pl-4 pr-12 bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
              onClick={() => setIsSearchOpen(true)}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* User/auth section - consistent width and height */}
        <div className="flex items-center h-10 min-w-[150px] justify-end">
          {isLoading ? (
            <div className="animate-pulse bg-white/20 h-10 w-20 rounded-md"></div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-4">
              <button className="text-white">
                <MessageSquare className="w-6 h-6" />
              </button>
              <button onClick={handleNotificationsClick} className="text-white ">
                <Bell className="w-6 h-6" />
              </button>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="flex items-center gap-2 text-white h-10"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={userImage}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium">{displayName}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button 
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleProfileClick}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </button>
                    <button 
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 h-10">
              <button 
                className="text-white border border-white px-4 h-10 rounded hover:bg-white/10 transition"
                onClick={handleLogin}
              >
                Login
              </button>
              <button 
                className="bg-white text-[#006699] px-4 h-10 rounded hover:bg-gray-100 transition"
                onClick={handleRegister}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      <SearchPopup 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default Navbar;
