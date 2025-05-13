'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, MessageSquare, ChevronDown, Search, LogOut, User, Menu, X } from 'lucide-react';
import SearchPopup from './SearchPopup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

interface NavbarProps {
  onSidebarToggle?: () => void; // Callback for toggling sidebar
  showSidebarToggle?: boolean; // Whether to show the sidebar toggle button
}

const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle, showSidebarToggle = false }) => {
  const { user, logout, isLoading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.mobile-menu-button')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = () => {
    router.push('/login');
    setIsMobileMenuOpen(false);
  };

  const handleRegister = () => {
    router.push('/register');
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/dashboard');
  };

  const handleNotificationsClick = () => {
    setIsMobileMenuOpen(false);
    router.push('/user/notification');
  };

  const handleChatClick = () => {
    setIsMobileMenuOpen(false);
    router.push('/user/chat');
  }

  const isLoggedIn = !!user;
  const displayName = user ? user.firstName : 'User';
  const userImage = '/Avatar.png';

  return (
    <>
      {/* Fixed height navbar with h-16 */}
      <nav className="bg-[#006699] px-4 md:px-6 h-16 flex items-center justify-between relative">
        {/* Logo and sidebar toggle */}
        <div className="flex items-center">
          {/* Sidebar toggle button - only shown on mobile if enabled */}
          {showSidebarToggle && (
            <button
              className="text-white mr-3"
              onClick={onSidebarToggle}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          
          <Link href="/" className="w-10">
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

        {/* Search - hidden on mobile, visible on md and up */}
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
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

        {/* User/auth section - visible on desktop */}
        <div className="hidden md:flex items-center h-10 min-w-[150px] justify-end">
          {isLoading ? (
            <div className="animate-pulse bg-white/20 h-10 w-20 rounded-md"></div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-4">
              <button className="text-white" onClick={handleChatClick}>
                <MessageSquare className="w-6 h-6" />
              </button>
              <button onClick={handleNotificationsClick} className="text-white">
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

        {/* Mobile menu and search buttons */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile search button */}
          <button 
            className="text-white p-2"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>
          
          {/* Mobile menu button */}
          <button 
            className="text-white p-2 mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-[#006699] shadow-lg absolute right-0 top-16 z-50 w-full sm:w-64 py-4 px-6"
        >
          {/* Mobile search - only shown in collapsed menu */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for skills"
                className="w-full h-10 px-4 py-2 rounded-md pl-4 pr-12 bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                readOnly
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="animate-pulse bg-white/20 h-10 w-full rounded-md"></div>
          ) : isLoggedIn ? (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3 pb-3 border-b border-white/20">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={userImage}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <span className="font-medium text-white">{displayName}</span>
              </div>
              
              {/* Navigation links */}
              <button 
                className="flex items-center gap-3 w-full py-2 text-white"
                onClick={handleProfileClick}
              >
                <User className="w-5 h-5" />
                Dashboard
              </button>
              
              <button 
                className="flex items-center gap-3 w-full py-2 text-white"
                onClick={handleChatClick}
              >
                <MessageSquare className="w-5 h-5" />
                Messages
              </button>
              
              <button 
                className="flex items-center gap-3 w-full py-2 text-white"
                onClick={handleNotificationsClick}
              >
                <Bell className="w-5 h-5" />
                Notifications
              </button>
              
              <div className="pt-3 border-t border-white/20">
                <button 
                  className="flex items-center gap-3 w-full py-2 text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button 
                className="w-full text-white border border-white px-4 py-2 rounded hover:bg-white/10 transition"
                onClick={handleLogin}
              >
                Login
              </button>
              <button 
                className="w-full bg-white text-[#006699] px-4 py-2 rounded hover:bg-gray-100 transition"
                onClick={handleRegister}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}

      <SearchPopup 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default Navbar;