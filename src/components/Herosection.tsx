'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const HeroSection: React.FC = () => {
  const router = useRouter();
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-blue-600">
      {/* Background image with blue waves */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png" // Place this image in your public/images folder
          alt="Blue wave background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Decorative stars */}
      <div className="absolute top-16 left-16 text-yellow-100 opacity-40 text-2xl">+</div>
      <div className="absolute top-32 right-32 text-yellow-100 opacity-40 text-lg">+</div>
      <div className="absolute top-48 left-48 text-yellow-100 opacity-40 text-lg">+</div>
      <div className="absolute top-24 right-64 text-yellow-100 opacity-40 text-lg">+</div>
      <div className="absolute top-80 right-16 text-yellow-100 opacity-40 text-lg">+</div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
        {/* New feature banner */}
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center px-4 py-2 bg-sky-700 rounded-full hover:bg-sky-600 cursor-pointer transition duration-300">
            <span className="mr-2 text-sm font-medium bg-blue-400 px-3 py-1 rounded-full">New feature</span>
            <span className="text-sm">Check out the team dashboard</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-5 h-5 ml-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </Link>
        </div>
        
        {/* Main heading */}
        <h1 className="max-w-3xl mx-auto mb-6 text-5xl font-bold text-center leading-tight">
          Unlock Skills, Spark Connections And Grow Together
        </h1>
        
        {/* Subheading */}
        <p className="max-w-2xl mx-auto mb-12 text-lg text-center text-blue-50">
          Swap skills, gain experience, and build your professional portfolio - all from the comfort of your dorm.
        </p>
        
        {/* CTA Button */}
        <button 
          className="px-8 py-3 text-blue-900 bg-blue-200 rounded-full font-medium hover:bg-blue-100 transition duration-300"
          onClick={() => router.push('/register')}
        >
          Join Now
        </button>
      </div>
    </div>
  );
};

export default HeroSection;