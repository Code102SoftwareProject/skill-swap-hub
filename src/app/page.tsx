'use client';
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/chatassistant/chatbot";
import HeroSection from "@/components/Herosection";
import Footer from "@/components/Footer";
import SuccessStories from "@/components/Testimonial";

export default function Home() {
  return (
    <>
      <div className="sticky top-0 z-50 w-full">
        <Navbar />
      </div>
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
        <HeroSection />
        
      </div>
      <Chatbot/>
      <SuccessStories />
      <Footer />
    </>
  );
}