'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, MessageSquare, Clock, User, RefreshCw, BookmarkX } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/homepage/Navbar';
import WatchPostButton from '@/components/communityForum/WatchPostButton';

interface WatchedPost {
  _id: string;
  title: string;
  content: string;
  forumId: {
    _id: string;
    title: string;
  };
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  likes: number;
  dislikes: number;
  replies: number;
  createdAt: string;
}

export default function WatchListPage() {
  const { user } = useAuth();
  const { getWatchedPosts } = useUserPreferences();
  const router = useRouter();
  
  const [watchedPosts, setWatchedPosts] = useState<WatchedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch watched posts
  const fetchWatchedPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await getWatchedPosts();
      
      if (response.success) {
        setWatchedPosts(response.data);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch watched posts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle post click
  const handlePostClick = (post: WatchedPost) => {
    router.push(`/forum/${post.forumId._id}/posts/${post._id}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Refresh watched posts
  const refreshWatchedPosts = () => {
    fetchWatchedPosts(true);
  };

  useEffect(() => {
    if (user) {
      fetchWatchedPosts();
    }
  }, [user]);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Please log in to view your watchlist</h2>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Bookmark className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Your Watchlist</h1>
            </div>
            
            <button
              onClick={refreshWatchedPosts}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="relative w-16 h-16">
                <div className="absolute w-16 h-16 rounded-full border-4 border-blue-100 opacity-30"></div>
                <div className="absolute w-16 h-16 rounded-full border-4 border-t-blue-500 animate-spin"></div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-10 px-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-red-600">Error loading watchlist: {error}</p>
              <button
                onClick={() => fetchWatchedPosts()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Posts */}
          {!loading && !error && (
            <div className="space-y-6">
              {watchedPosts.length === 0 ? (
                <div className="text-center py-16">
                  <BookmarkX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Your watchlist is empty</h3>
                  <p className="text-gray-500 mb-6">
                    Start watching posts to keep track of discussions you're interested in!
                  </p>
                  <button
                    onClick={() => router.push('/forum')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Explore Forums
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {watchedPosts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      whileHover={{ y: -3 }}
                      className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white cursor-pointer"
                      onClick={() => handlePostClick(post)}
                    >
                      {/* Forum badge */}
                      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                        <span className="text-sm text-blue-600 font-medium">
                          {post.forumId.title}
                        </span>
                      </div>

                      <div className="p-6">
                        {/* Post header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100">
                              <img 
                                src={'/user-avatar.png'} 
                                alt={post.author.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{post.author.name}</p>
                              <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div onClick={(e) => e.stopPropagation()}>
                            <WatchPostButton 
                              postId={post._id} 
                              size="sm" 
                              onStatusChange={() => fetchWatchedPosts()} 
                            />
                          </div>
                        </div>

                        {/* Post title */}
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{post.title}</h3>

                        {/* Post content preview */}
                        <div className="prose max-w-none mb-4">
                          <div 
                            className="text-gray-700 line-clamp-3"
                            dangerouslySetInnerHTML={{ 
                              __html: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '')
                            }}
                          />
                        </div>

                        {/* Post stats */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 text-green-600">
                              <span className="text-sm font-medium">👍 {post.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-red-600">
                              <span className="text-sm font-medium">👎 {post.dislikes}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-blue-600">
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-sm font-medium">{post.replies}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Added to watchlist
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
