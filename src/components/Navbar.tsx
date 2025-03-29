'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, MessageSquare, ChevronDown, Search } from 'lucide-react';
import SearchPopup from './SearchPopup';
import { useAuth } from '@/lib/context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const categoriesRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  
  const isLoggedIn = !!user;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
      
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav className="bg-[#006699] px-4 py-3 flex items-center justify-between">
        {/* Left section with logo - increased logo size */}
        <Link href="/" className="flex items-center">
          <div className="w-10 h-10 relative -my-3"> {/* Increased size but negative margin to maintain navbar height */}
            <Image
              src="/logo.png"
              alt="SkillSwap Hub"
              width={40}
              height={40}
              className="text-white"
            />
          </div>
        </Link>

        {/* Center section with categories and search */}
        <div className="flex flex-1 items-center justify-center gap-1 max-w-3xl">
          <div className="relative" ref={categoriesRef}>
            <button 
              className="flex items-center gap-2 text-white px-3 py-2 rounded-md border border-white/20"
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            >
              Categories
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isCategoriesOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10">
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Coding & Programmingt</button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Creative Arts & Entertainment</button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Home Improvement & DIY</button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Education & Tutoring</button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Culinary & Food Services</button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Lifestyle & Personal Services</button>
              </div>
            )}
          </div>

          <div className="w-full max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for skills"
                className="w-full px-4 py-2 rounded-md pl-4 pr-10"
                onClick={() => setIsSearchOpen(true)}
                readOnly
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {isLoggedIn ? (
          // After login - User is authenticated
          <div className="flex items-center gap-4">
            <button className="text-white">
              <MessageSquare className="w-6 h-6" />
            </button>
            <button className="text-white">
              <Bell className="w-6 h-6" />
            </button>
            
            <div className="relative" ref={profileRef}>
              <button 
                className="flex items-center gap-2 text-white"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
                  <Image
                    src={user?.avatar || "/Avatar.png"}
                    alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <span className="font-medium">{user?.firstName || 'User'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Before login - User is not authenticated
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="bg-transparent text-white border border-white px-4 py-1.5 rounded hover:bg-white/10 transition">
                Login
              </button>
            </Link>
            <Link href="/register">
              <button className="bg-white text-[#006699] px-4 py-1.5 rounded hover:bg-gray-100 transition">
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </nav>

      <SearchPopup 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default Navbar;