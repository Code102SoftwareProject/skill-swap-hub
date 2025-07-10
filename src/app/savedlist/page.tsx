'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, MessageSquare, Clock, User, RefreshCw, BookmarkX } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/homepage/Navbar';
import WatchPostButton from '@/components/communityForum/WatchPostButton';

interface SavedPost {
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
  views?: number;
  createdAt: string;
}

export default function SavedListPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const { getWatchedPosts } = useUserPreferences();
  const router = useRouter();
  
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch saved posts with retry logic
  const fetchSavedPosts = async (isRefresh = false, retryCount = 0) => {
    // Don't fetch if auth is still loading or user/token is not available
    if (authLoading || !user || !token) {
      if (!authLoading && (!user || !token)) {
        // Auth is done loading but no user/token - stop loading
        setLoading(false);
      }
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Clear previous error when starting a new fetch
      setError(null);
      
      const response = await getWatchedPosts();
      
      if (response.success) {
        setSavedPosts(response.data);
        setError(null);
      } else {        
        // For authentication errors, don't retry automatically
        if (response.error?.includes('Authentication') || response.error?.includes('log in') || response.error?.includes('token')) {
          throw new Error(response.error);
        }
        
        // For other errors, retry once after a short delay
        if (retryCount < 1) {
          setTimeout(() => {
            fetchSavedPosts(isRefresh, retryCount + 1);
          }, 1000);
          return;
        }
        
        throw new Error(response.error || 'Failed to fetch saved posts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching saved posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle post click
  const handlePostClick = (post: SavedPost) => {
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

  // Refresh saved posts
  const refreshSavedPosts = () => {
    fetchSavedPosts(true);
  };

  // Handle manual retry
  const handleRetry = () => {
    setError(null);
    fetchSavedPosts();
  };

  useEffect(() => {
    // Wait for auth to finish loading before attempting to fetch
    if (!authLoading) {
      if (user && token) {
        fetchSavedPosts();
      } else {
        // If auth finished loading but no user or token, stop loading state
        setLoading(false);
      }
    }
  }, [user, token, authLoading]);

  // Show loading while authentication is being determined
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Please log in to view your saved posts</h2>
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
              <h1 className="text-3xl font-bold text-gray-900">Your Saved Posts</h1>
            </div>
            
            <button
              onClick={refreshSavedPosts}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Loading state */}
          {(loading || (user && !token)) && (
            <div className="flex justify-center py-20">
              <div className="relative w-16 h-16">
                <div className="absolute w-16 h-16 rounded-full border-4 border-blue-100 opacity-30"></div>
                <div className="absolute w-16 h-16 rounded-full border-4 border-t-blue-500 animate-spin"></div>
              </div>
            </div>
          )}

          {/* Error state - but don't show auth errors if we're still setting up */}
          {error && !(authLoading || (!user || !token)) && (
            <div className="text-center py-10 px-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-red-600 mb-4">Error loading saved posts: {error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && user && token && (
            <>
              {savedPosts.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 px-4 bg-white rounded-xl border-2 border-dashed border-blue-200"
                >
                  <BookmarkX className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Your saved posts list is empty</h3>
                  <p className="text-gray-500 mb-6">Save posts by clicking the bookmark icon on any post to see them here.</p>
                  <button
                    onClick={() => router.push('/forum')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Forums
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence>
                    {savedPosts.map((post, index) => (
                      <motion.div
                        key={post._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
                        onClick={() => handlePostClick(post)}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-grow">
                              <div className="flex items-center space-x-2 mb-3">
                                <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                  {post.forumId.title}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Added to saved posts
                                </span>
                              </div>
                              
                              <h3 
                                className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors"
                              >
                                {post.title}
                              </h3>
                              
                              <div 
                                className="text-gray-600 text-sm line-clamp-2 mb-4"
                                dangerouslySetInnerHTML={{ 
                                  __html: post.content.length > 150 
                                    ? post.content.substring(0, 150) + '...' 
                                    : post.content 
                                }}
                              />
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4" />
                                  <span>{post.author.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDate(post.createdAt)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MessageSquare className="w-4 h-4" />
                                  <span>{post.replies} replies</span>
                                </div>
                                {post.views !== undefined && (
                                  <div className="flex items-center space-x-1">
                                    <span>{post.views} views</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <WatchPostButton 
                                postId={post._id} 
                                size="sm" 
                                showText={false}
                                onStatusChange={() => {
                                  // Remove from local state when unsaved
                                  setSavedPosts(prev => prev.filter(p => p._id !== post._id));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
