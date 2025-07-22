'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Target, 
  Heart, 
  Globe, 
  BookOpen, 
  Award, 
  Zap,
  CheckCircle,
  ArrowRight,
  Mail,
  MessageCircle
} from 'lucide-react';

const AboutUsPage = () => {
  const router = useRouter();

  const values = [
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in the power of peer-to-peer learning and building meaningful connections between learners and teachers.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BookOpen,
      title: 'Knowledge Sharing',
      description: 'Everyone has something valuable to teach. We make it easy to share knowledge and learn from others in your community.',
      color: 'from-purple-500 to-blue-500'
    },
    {
      icon: Target,
      title: 'Goal-Oriented',
      description: 'We help you set clear learning objectives and connect you with the right people to achieve your skill development goals.',
      color: 'from-green-500 to-blue-500'
    },
    {
      icon: Heart,
      title: 'Passion-Driven',
      description: 'Learning should be exciting! We connect passionate learners with enthusiastic teachers who love sharing their expertise.',
      color: 'from-pink-500 to-purple-500'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Learners', icon: Users },
    { number: '500+', label: 'Skills Available', icon: BookOpen },
    { number: '25K+', label: 'Successful Matches', icon: Award },
    { number: '95%', label: 'Satisfaction Rate', icon: CheckCircle }
  ];

  const teamMembers = [
    {
      name: 'Sarah Chen',
      role: 'Co-Founder & CEO',
      description: 'Former educator passionate about democratizing learning through technology.',
      image: '/team/sarah.jpg'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Co-Founder & CTO',
      description: 'Tech enthusiast building scalable platforms for peer-to-peer connections.',
      image: '/team/michael.jpg'
    },
    {
      name: 'Emily Johnson',
      role: 'Head of Community',
      description: 'Community builder focused on creating safe, inclusive learning environments.',
      image: '/team/emily.jpg'
    },
    {
      name: 'David Kim',
      role: 'Head of Product',
      description: 'Product strategist designing intuitive experiences for skill exchange.',
      image: '/team/david.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006699] via-blue-700 to-indigo-900">
      {/* Header with Back Button */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 text-cyan-300 opacity-20 text-2xl">+</div>
          <div className="absolute top-32 right-32 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute top-48 left-48 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute -right-20 top-1/4 w-96 h-96 bg-gradient-to-l from-cyan-400/10 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors duration-300 mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
                About Us
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to revolutionize learning by connecting passionate individuals 
              who want to share their skills and learn from each other.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-cyan-300" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-lg text-blue-100 leading-relaxed mb-8">
            At SkillSwap Hub, we believe that everyone has something valuable to teach and something new to learn. 
            Our platform breaks down traditional barriers to education by creating a community where knowledge flows 
            freely between peers, fostering personal growth and meaningful connections.
          </p>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-cyan-300/20">
            <blockquote className="text-2xl font-semibold text-white italic">
              "Empowering individuals to unlock their potential through peer-to-peer skill exchange, 
              building a world where learning never stops and knowledge knows no boundaries."
            </blockquote>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-r from-blue-800/50 to-[#006699]/50 py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -left-20 bottom-1/4 w-80 h-80 bg-gradient-to-r from-cyan-400/10 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-xl text-blue-100">The principles that guide everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-cyan-300/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 text-center">{value.title}</h3>
                <p className="text-blue-100 text-center text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Our Impact</h2>
          <p className="text-xl text-blue-100">Building a thriving community of learners</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:transform hover:scale-105">
                <stat.icon className="w-8 h-8 text-cyan-300 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Story Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Globe className="w-12 h-12 text-cyan-300 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Our Story</h2>
            <p className="text-xl text-blue-100">How we started and where we're going</p>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-cyan-300/20">
              <h3 className="text-2xl font-semibold text-white mb-4">The Beginning</h3>
              <p className="text-blue-100 leading-relaxed">
                Founded in 2023, SkillSwap Hub was born from a simple observation: traditional education often fails to 
                connect people who want to learn with those who are passionate about teaching. Our founders, having 
                experienced the limitations of formal learning systems, envisioned a platform where knowledge could be 
                shared freely and organically within communities.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-cyan-300/20">
              <h3 className="text-2xl font-semibold text-white mb-4">Today</h3>
              <p className="text-blue-100 leading-relaxed">
                Today, we're proud to serve thousands of learners and teachers worldwide. From coding bootcamps to 
                cooking classes, from language exchange to professional mentoring, our platform has facilitated 
                countless skill exchanges that have transformed lives and careers.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-cyan-300/20">
              <h3 className="text-2xl font-semibold text-white mb-4">The Future</h3>
              <p className="text-blue-100 leading-relaxed">
                We're just getting started. Our vision extends beyond simple skill exchange to creating a global 
                community where learning is collaborative, accessible, and deeply human. We're building features for 
                group learning, skill certification, and even more innovative ways to connect learners and teachers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Join Our Community</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Be part of a movement that's changing how the world learns. Start sharing your skills today!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            className="group bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-cyan-300 hover:to-blue-400 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2 min-w-[220px]"
            onClick={() => router.push('/register')}
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            className="group bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 min-w-[220px]"
            onClick={() => router.push('/contact-us')}
          >
            <MessageCircle className="w-5 h-5" />
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;