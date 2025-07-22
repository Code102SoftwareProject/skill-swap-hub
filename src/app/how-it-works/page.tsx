'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, MessageCircle, Star, BookOpen, Trophy, CheckCircle, ArrowRight, Play, Zap } from 'lucide-react';

const HowItWorksPage = () => {
  const router = useRouter();

  const steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      description: 'Sign up and tell us about the skills you want to learn and the ones you can teach. Build your comprehensive skill profile.',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      features: ['Add your skills', 'Set learning goals', 'Upload portfolio', 'Complete verification']
    },
    {
      number: '02',
      title: 'Find Perfect Matches',
      description: 'Our smart algorithm connects you with users who want to learn what you teach and can teach what you want to learn.',
      icon: Star,
      color: 'from-purple-500 to-blue-500',
      features: ['Smart matching', 'Filter by location', 'Skill compatibility', 'User ratings']
    },
    {
      number: '03',
      title: 'Connect & Chat',
      description: 'Start conversations with your matches through our secure chat platform. Plan your skill exchange sessions together.',
      icon: MessageCircle,
      color: 'from-green-500 to-blue-500',
      features: ['Real-time messaging', 'File sharing', 'Video calls', 'Schedule meetings']
    },
    {
      number: '04',
      title: 'Learn & Teach',
      description: 'Exchange skills through virtual or in-person sessions. Track your progress and build lasting professional relationships.',
      icon: Trophy,
      color: 'from-orange-500 to-red-500',
      features: ['Flexible scheduling', 'Progress tracking', 'Session notes', 'Skill certificates']
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
                How It Works
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Discover how easy it is to swap skills, connect with peers, and grow your expertise 
              through our innovative peer-to-peer learning platform.
            </p>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="space-y-16">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-16`}
            >
              {/* Step Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg`}>
                    {step.number}
                  </div>
                  <step.icon className="w-8 h-8 text-cyan-300" />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {step.title}
                </h3>
                
                <p className="text-lg text-blue-100 mb-6 leading-relaxed">
                  {step.description}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {step.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-blue-200">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Visual */}
              <div className="flex-1 flex justify-center">
                <div className={`relative w-80 h-80 bg-gradient-to-r ${step.color} rounded-3xl flex items-center justify-center overflow-hidden`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-4 border-2 border-white/30 rounded-2xl"></div>
                    <div className="absolute inset-8 border border-white/20 rounded-xl"></div>
                  </div>
                  
                  {/* Icon */}
                  <step.icon className="w-32 h-32 text-white relative z-10" />
                  
                  {/* Step Number */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-blue-800/50 to-[#006699]/50 py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -left-20 bottom-1/4 w-80 h-80 bg-gradient-to-r from-cyan-400/10 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose SkillSwap Hub?</h2>
            <p className="text-xl text-blue-100">Join thousands of learners building skills together</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Learn Anything',
                description: 'Access a wide range of skills from coding to cooking, taught by passionate experts.'
              },
              {
                icon: Users,
                title: 'Build Network',
                description: 'Connect with like-minded individuals and build lasting professional relationships.'
              },
              {
                icon: Zap,
                title: 'Grow Fast',
                description: 'Accelerate your learning through personalized, hands-on skill exchange sessions.'
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-cyan-300/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 text-center">{benefit.title}</h3>
                <p className="text-blue-100 text-center">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join our community of learners and teachers. Start swapping skills today!
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
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;