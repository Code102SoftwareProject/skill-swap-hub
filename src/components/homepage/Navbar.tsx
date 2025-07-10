'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, MessageSquare, ChevronDown, Search, LogOut, User, Menu, X } from 'lucide-react';
import SearchPopup from './SearchPopup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages';

interface NavbarProps {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle, showSidebarToggle = false }) => {
  const { user, logout, isLoading } = useAuth();
  const { unreadCount, fetchUnreadCount } = useNotifications(user?._id || null);
  const { unreadCount: unreadMessageCount, fetchUnreadCount: fetchUnreadMessageCount } = useUnreadMessages(user?._id || null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const NotificationBell = ({ onClick, unreadCount }: { onClick: () => void; unreadCount: number }) => (
    <button onClick={onClick} className="text-white relative">
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full"></span>
      )}
    </button>
  );

  const MessageBell = ({ onClick, unreadCount }: { onClick: () => void; unreadCount: number }) => (
    <button onClick={onClick} className="text-white relative">
      <MessageSquare className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full"></span>
      )}
    </button>
  );

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

  const isLoggedIn = !!user && !isLoading;
  const displayName = user ? user.firstName : 'User';
  const userImage = user?.avatar || '/Avatar.png';

  return (
    <>
      <nav className="bg-[#006699] px-4 md:px-6 h-16 flex items-center justify-between relative">
        <div className="flex items-center">
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

        <div className="hidden md:flex items-center h-10 min-w-[150px] justify-end">
          {isLoading ? (
            <div className="animate-pulse bg-white/20 h-10 w-20 rounded-md"></div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-4">
              <MessageBell onClick={handleChatClick} unreadCount={unreadMessageCount} />
              <NotificationBell onClick={handleNotificationsClick} unreadCount={unreadCount} />
              
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

        <div className="md:hidden flex items-center gap-2">
          <button 
            className="text-white p-2"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>
          
          <button 
            className="text-white p-2 mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-[#006699] shadow-lg absolute right-0 top-16 z-50 w-full sm:w-64 py-4 px-6"
        >
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
              
              <button 
                className="flex items-center gap-3 w-full py-2 text-white"
                onClick={handleProfileClick}
              >
                <User className="w-5 h-5" />
                Dashboard
              </button>
              
              <button 
                className="flex items-center gap-3 w-full py-2 text-white relative"
                onClick={handleChatClick}
              >
                <MessageSquare className="w-5 h-5" />
                Messages
                {unreadMessageCount > 0 && (
                  <span className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-red-500 w-2 h-2 rounded-full"></span>
                )}
              </button>
              
              <button 
                className="flex items-center gap-3 w-full py-2 text-white relative"
                onClick={handleNotificationsClick}
              >
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-red-500 w-2 h-2 rounded-full"></span>
                )}
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