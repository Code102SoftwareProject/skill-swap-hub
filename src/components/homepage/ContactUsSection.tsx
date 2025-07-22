'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Mail, Phone, ArrowRight, Users, Star, Clock } from 'lucide-react';

const ContactUsSection: React.FC = () => {
  const router = useRouter();

  const handleContactUsClick = () => {
    router.push('/contact-us');
  };

  return (
    <section className="bg-gradient-to-b from-blue-800 to-[#006699] py-20 px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-16 left-16 text-cyan-300 opacity-20 text-2xl">+</div>
        <div className="absolute top-32 right-32 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-48 left-48 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-24 right-64 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-80 right-16 text-cyan-300 opacity-20 text-lg">+</div>
        
        {/* Flowing lines similar to success stories */}
        <div className="absolute -right-20 top-1/2 w-96 h-96 bg-gradient-to-l from-cyan-400/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -left-20 bottom-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
                Got Questions?
              </span>
              <br />
              <span className="text-blue-100">We're Here to Help!</span>
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
              Whether you need support, have feedback, or want to learn more about our platform, 
              our team is ready to assist you on your skill-swapping journey.
            </p>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Quick Support */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-cyan-300/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Quick Support</h3>
              <p className="text-blue-100 text-sm mb-4">Get instant help with common questions and issues</p>
              <div className="text-cyan-300 text-sm font-medium">24/7 Available</div>
            </div>

            {/* Personal Help */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-cyan-300/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Personal Help</h3>
              <p className="text-blue-100 text-sm mb-4">Connect with our support team for personalized assistance</p>
              <div className="text-cyan-300 text-sm font-medium">Response within hours</div>
            </div>

            {/* Feedback & Ideas */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-cyan-300/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Feedback & Ideas</h3>
              <p className="text-blue-100 text-sm mb-4">Share your thoughts and help us improve the platform</p>
              <div className="text-cyan-300 text-sm font-medium">Your voice matters</div>
            </div>
          </div>

          {/* Main CTA */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Ready to get in touch?</h3>
                <p className="text-blue-100">
                  Send us a message and we'll respond as soon as possible. We're here to help you succeed!
                </p>
              </div>
              <button
                onClick={handleContactUsClick}
                className="group bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-cyan-300 hover:to-blue-400 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Us
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-12 text-blue-100">
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-5 h-5 text-cyan-300" />
              <span>support@skillswaphub.com</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-blue-300/30"></div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <MessageCircle className="w-5 h-5 text-cyan-300" />
              <span>Live Chat Available</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUsSection;