'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Bell, MessageSquare, ChevronDown, Search, LogOut, User } from 'lucide-react';
import SearchPopup from './SerarchPopup';
import { useRouter } from 'next/navigation';

const Navbar: React.FC = () => {
  const [userName, setUserName] = useState('User');
  const [userId, setUserId] = useState<string | null>(null);
  const [userImage, setUserImage] = useState('/user-avatar.png'); // Default image
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Function to decode JWT token
  const decodeJWT = (token: string) => {
    try {
      // Extract the payload part of the JWT (the second part)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    // Remove token and user data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Update state
    setIsLoggedIn(false);
    setUserName('User');
    setUserId(null);
    setUserImage('/user-avatar.png');
    setIsDropdownOpen(false);
    
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    router.push('/profile');
  };

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

  useEffect(() => {
    // Get user data and token from localStorage on component mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedToken) {
      setIsLoggedIn(true);
      
      try {
        const decodedToken = decodeJWT(storedToken);
        if (decodedToken && decodedToken.userId) {
          setUserId(decodedToken.userId);
        }
      } catch (error) {
        console.error('Error decoding auth token:', error);
      }
    } else {
      setIsLoggedIn(false);
    }

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.firstName) {
          setUserName(userData.firstName);
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }, []);

  // Fetch user image when userId is available
  useEffect(() => {
    if (userId) {
      // Attempt to fetch user image using userId
      fetch(`/api/users/${userId}/image`)
        .then(response => {
          if (response.ok) {
            return response.url;
          }
          throw new Error('Failed to fetch user image');
        })
        .then(imageUrl => {
          setUserImage(imageUrl);
        })
        .catch(error => {
          console.error('Error fetching user image:', error);
          // Keep the default image on error
        });
    }
  }, [userId]);

  return (
    <>
      <nav className="bg-[#006699] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="text-black"
            />
          </div>
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

        <div className="flex items-center gap-4">
          <button className="text-white">
            <MessageSquare className="w-6 h-6" />
          </button>
          <button className="text-white">
            <Bell className="w-6 h-6" />
          </button>
          
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                className="flex items-center gap-2 text-white"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={userImage}
                    alt={userName}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <span className="font-medium">{userName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleProfileClick}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
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
          ) : (
            <button 
              className="bg-white text-[#006699] px-4 py-2 rounded-md font-medium"
              onClick={handleLogin}
            >
              Log In
            </button>
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