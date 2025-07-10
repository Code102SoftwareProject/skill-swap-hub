// File: src/app/page.tsx
'use client';
import Navbar from "@/components/homepage/Navbar";
import Chatbot from "@/components/chatassistant/chatbot";
import HeroSection from "@/components/homepage/Herosection";
import Footer from "@/components/homepage/Footer";
import SuccessStoriesCarousel from "@/components/homepage/SuccessStoriesCarousel";
import TrendingSkills from "@/components/homepage/TrendingSkills";

export default function Home() {
  return (
    <>
      <div className="sticky top-0 z-50 w-full">
        <Navbar />
      </div>
      
      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
        <HeroSection />
      </div>
      
      {/* Trending Skills Section - Now with consistent blue theme */}
      <TrendingSkills />
      
      {/* Chatbot */}
      <Chatbot />
      
      {/* Success Stories - Now with consistent blue theme */}
      <SuccessStoriesCarousel />
      
      {/* Footer */}
      <Footer />
    </>
  );
}