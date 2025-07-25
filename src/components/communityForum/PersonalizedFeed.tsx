'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, User, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/lib/context/AuthContext';
import WatchPostButton from './WatchPostButton';
import { useRouter } from 'next/navigation';

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  forumId: {
    _id: string;
    title: string;
  };
  likes: number;
  dislikes: number;
  replies: number;
  views?: number;
  createdAt: string;
  score?: number;
}

interface PersonalizedFeedProps {
  className?: string;
}

const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { getPersonalizedFeed, trackInteraction } = useUserPreferences();
  const router = useRouter();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [personalized, setPersonalized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch feed data
  const fetchFeed = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await getPersonalizedFeed(pageNum, 10);
      
      if (response.success) {
        const { posts: newPosts, pagination, personalized: isPersonalized } = response.data;
        
        if (pageNum === 1 || isRefresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setPersonalized(isPersonalized);
        setHasMore(pagination.hasNext);
        setPage(pageNum);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch feed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getPersonalizedFeed]); // Only depend on getPersonalizedFeed

  // Load more posts
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchFeed(page + 1);
    }
  };

  // Refresh feed
  const refreshFeed = () => {
    fetchFeed(1, true);
  };

  // Handle post click
  const handlePostClick = async (post: Post) => {
    // Track view interaction
    await trackInteraction({
      postId: post._id,
      forumId: post.forumId._id,
      interactionType: 'view',
      timeSpent: 0
    });

    // Navigate to post
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

  // Get image URL
  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return `/api/file/retrieve?fileUrl=${encodeURIComponent(imageUrl)}`;
    } else {
      return `/api/file/retrieve?file=${encodeURIComponent(imageUrl)}`;
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user, fetchFeed]);

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Please log in to see your personalized feed.</p>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="relative w-16 h-16">
          <div className="absolute w-16 h-16 rounded-full border-4 border-blue-100 opacity-30"></div>
          <div className="absolute w-16 h-16 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 px-4 bg-red-50 border border-red-100 rounded-lg">
        <p className="text-red-600">Error loading feed: {error}</p>
        <button
          onClick={refreshFeed}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {personalized ? (
            <Sparkles className="w-6 h-6 text-blue-600" />
          ) : (
            <TrendingUp className="w-6 h-6 text-gray-600" />
          )}
          <h2 className="text-2xl font-semibold text-gray-900">
            {personalized ? 'Your Personalized Feed' : 'Trending Posts'}
          </h2>
        </div>
        
        <button
          onClick={refreshFeed}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Personalization status */}
      {!personalized && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Tip:</strong> Interact with posts you like to get a more personalized feed! 
            Like, comment, and watch posts to improve your recommendations.
          </p>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        <AnimatePresence>
          {posts.map((post, index) => (
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
                    <WatchPostButton postId={post._id} size="sm" />
                  </div>
                </div>

                {/* Post title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{post.title}</h3>

                {/* Post image */}
                {post.imageUrl && (
                  <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="relative w-full h-64">
                      <img 
                        src={getImageUrl(post.imageUrl)} 
                        alt={`Image for ${post.title}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

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
                  
                  {post.score && personalized && (
                    <div className="text-xs text-gray-500">
                      Relevance: {Math.round(post.score)}%
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}

      {/* No more posts */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">You've reached the end of your feed!</p>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && !loading && (
        <div className="text-center py-16">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts in your feed yet</h3>
          <p className="text-gray-500 mb-6">
            Start exploring forums and interacting with posts to build your personalized feed!
          </p>
          <button
            onClick={() => router.push('/forum')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explore Forums
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonalizedFeed;
