'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Bell, MessageSquare, ChevronDown, Search } from 'lucide-react';
import SearchPopup from './SerarchPopup';

interface NavbarProps {
  userName: string;
  userImage: string;
}

const Navbar: React.FC<NavbarProps> = ({ userName, userImage }) => {
  const [categories, setCategories] = useState('Categories');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <nav className="bg-[#006699] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="w-8 h-8">
            <Image
              src="/api/placeholder/32/32"
              alt="Logo"
              width={32}
              height={32}
              className="text-white"
            />
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 text-white px-4 py-2 rounded-md border border-white/20">
              {categories}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
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

        <div className="flex items-center gap-4">
          <button className="text-white">
            <MessageSquare className="w-6 h-6" />
          </button>
          <button className="text-white">
            <Bell className="w-6 h-6" />
          </button>
          
          <button className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-full overflow-hidden">
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