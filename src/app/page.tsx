// File: src/app/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Navbar from "@/components/homepage/Navbar";
import Chatbot from "@/components/chatassistant/chatbot";
import Footer from "@/components/homepage/Footer";
import SuccessStoriesCarousel from "@/components/homepage/SuccessStoriesCarousel";
import TrendingSkills from "@/components/homepage/TrendingSkills";
import { 
  ArrowRight, 
  Sparkles, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Star,
  Zap,
  Award,
  ChevronDown,
  Play
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Enhanced Hero Section Component
const EnhancedHeroSection = () => {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<{
    activeLearners: number | null;
    skillsAvailable: number | null;
    successfulMatches: number | null;
    totalMatches: number | null;
    satisfactionRate: number | null;
  }>({
    activeLearners: null,
    skillsAvailable: null,
    successfulMatches: null,
    totalMatches: null,
    satisfactionRate: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Fetch hero stats from backend
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const res = await fetch('/api/stats/hero');
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#006699] via-blue-700 to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"
          style={{
            left: `${20 + mousePosition.x * 0.02}%`,
            top: `${30 + mousePosition.y * 0.02}%`,
            animationDelay: '0s',
            animationDuration: '8s'
          }}
        />
        <div 
          className="absolute w-80 h-80 bg-gradient-to-r from-purple-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse"
          style={{
            right: `${10 + mousePosition.x * 0.03}%`,
            bottom: `${20 + mousePosition.y * 0.03}%`,
            animationDelay: '2s',
            animationDuration: '10s'
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded-full blur-2xl animate-pulse"
          style={{
            left: `${60 + mousePosition.x * 0.015}%`,
            top: `${10 + mousePosition.y * 0.015}%`,
            animationDelay: '4s',
            animationDuration: '12s'
          }}
        />

        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-cyan-300/40 rotate-45 animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-blue-300/40 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/6 w-3 h-3 bg-purple-300/40 rotate-45 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-3/4 w-5 h-5 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '3s' }} />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Announcement Banner */}
        <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div 
            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-cyan-300/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
            onClick={() => router.push('/dashboard')}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="text-sm font-medium text-cyan-100">New Features</span>
            </div>
            <span className="text-sm text-blue-100">Check out the team dashboard</span>
            <ArrowRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className={`text-5xl md:text-7xl font-bold mb-6 transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Unlock Skills,
          </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            Spark Connections
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          Swap skills, gain experience, and build your professional portfolio - all from the comfort of your dorm.
          <span className="text-cyan-300 font-semibold"> Join our vibrant community</span> and 
          <span className="text-purple-300 font-semibold"> grow together</span>.
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transform transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <button 
            className="group bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-cyan-300 hover:to-blue-400 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2"
            onClick={() => router.push('/register')}
          >
            Join Now
            <Zap className="w-5 h-5 group-hover:animate-pulse" />
          </button>
          <button className="group bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />
            Watch Demo
          </button>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 transform transition-all duration-1000 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {[
            {
              number: loadingStats || stats.activeLearners === null ? '...' : stats.activeLearners.toLocaleString(),
              label: 'Active Learners',
              icon: Users
            },
            {
              number: loadingStats || stats.skillsAvailable === null ? '...' : stats.skillsAvailable.toLocaleString(),
              label: 'Skills Available',
              icon: BookOpen
            },
            {
              number:
                loadingStats || stats.totalMatches === null
                  ? '...'
                  : stats.totalMatches.toLocaleString(),
              label: 'Total Matches',
              icon: Star
            },
            {
              number: loadingStats || stats.satisfactionRate === null ? '...' : `${stats.satisfactionRate}%`,
              label: 'Satisfaction Rate',
              icon: Award
            }
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:transform hover:scale-105">
                <stat.icon className="w-8 h-8 text-cyan-300 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        
      </div>
    </section>
  );
};



export default function Home() {
  return (
    <>
      <div className="sticky top-0 z-50 w-full">
        <Navbar />
      </div>
      
      {/* Enhanced Hero Section */}
      <EnhancedHeroSection />
      
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