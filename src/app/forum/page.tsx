'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, Users, Search, Loader, TrendingUp, Sparkles } from 'lucide-react';
import Navbar from '@/components/homepage/Navbar';
import Chatbot from "@/components/chatassistant/chatbot";
import UnifiedForumFeed from '@/components/communityForum/UnifiedForumFeed';
import { IForum } from '@/lib/models/Forum';
import { useAuth } from '@/lib/context/AuthContext';

export default function ForumMainPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [forums, setForums] = useState<IForum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState<'grid' | 'feed'>('grid');

  useEffect(() => {
    const fetchForums = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/forums');
        
        if (!response.ok) {
          throw new Error('Failed to fetch forums');
        }
        
        const data = await response.json();
        setForums(data.forums || []);
      } catch (err) {
        console.error('Error fetching forums:', err);
        setError('Unable to load forums. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForums();
  }, []);

  const filteredForums = forums.filter(forum =>
    forum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    forum.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const navigateToForum = (forumId: string) => {
    router.push(`/forum/${forumId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50">
          <Navbar />
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading forums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50">
          <Navbar />
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <MessageSquare className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-gray-900 mb-4"
          >
            Community Forums
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Connect, share knowledge, and collaborate with fellow learners in our vibrant community discussions.
          </motion.p>
          
          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-md w-full"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search forums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex bg-white border border-gray-300 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setSelectedView('grid')}
                className={`px-4 py-3 flex items-center space-x-2 transition-colors ${
                  selectedView === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Forums</span>
              </button>
              <button
                onClick={() => setSelectedView('feed')}
                className={`px-4 py-3 flex items-center space-x-2 transition-colors ${
                  selectedView === 'feed' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {user ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                <span>{user ? 'My Feed' : 'Recent Posts'}</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {selectedView === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredForums.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {searchTerm ? 'No forums found' : 'No forums available'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'Try adjusting your search terms to find what you\'re looking for.'
                      : 'Check back later for new forum discussions.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredForums.map((forum, index) => (
                    <motion.div
                      key={forum._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      onClick={() => navigateToForum(forum._id)}
                    >
                      {/* Forum Image */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                            {forum.title}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Forum Content */}
                      <div className="p-6">
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {forum.description}
                        </p>
                        
                        {/* Forum Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{forum.posts || 0} posts</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{forum.replies || 0} replies</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(forum.lastActive)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <UnifiedForumFeed className="bg-white rounded-xl shadow-md p-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <Chatbot />
    </div>
  );
}
