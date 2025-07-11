'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader, MessageSquare, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePostPopup from './CreatePostPopup';
import LikeDislikeButtons from './likedislikebutton';
import WatchPostButton from './WatchPostButton';
import { useAuth } from '@/lib/context/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  replies: number;
  views?: number;
}

interface ForumPostsProps {
  forumId: string;
}

const ForumPosts: React.FC<ForumPostsProps> = ({ forumId }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { trackInteraction } = useUserPreferences();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  
  const currentUserId = user ? user._id : 'current-user-id';

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forums/${forumId}/posts`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch forum posts');
      }
      
      const data = await response.json();
      setPosts(data.posts);
    } catch (err) {
      console.error('Error fetching forum posts:', err);
      setError('Unable to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    if (forumId) {
      fetchPosts();
    }
  }, [forumId, fetchPosts]);

  const handleCreatePost = () => {
    setIsCreatePostOpen(true);
  };

  const handlePostCreated = () => {
    // Refresh the posts after a new one is created
    fetchPosts();
  };

  const handleLikeUpdate = (postId: string, newLikes: number, newDislikes: number) => {
    // Update the likes/dislikes count in the local state without refetching
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === postId 
          ? { ...post, likes: newLikes, dislikes: newDislikes } 
          : post
      )
    );
  };

  const getUserLikeStatus = (post: Post) => {
    if (post.likedBy?.includes(currentUserId)) {
      return 'liked';
    }
    if (post.dislikedBy?.includes(currentUserId)) {
      return 'disliked';
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get proper image URL
  const getImageUrl = (imageUrl: string) => {
    // Check if it's already a full URL (starts with http or https)
    if (imageUrl.startsWith('http')) {
      // For full URLs, pass them to the file retrieval API
      return `/api/file/retrieve?fileUrl=${encodeURIComponent(imageUrl)}`;
    } else {
      // For just filenames, use the file parameter
      return `/api/file/retrieve?file=${encodeURIComponent(imageUrl)}`;
    }
  };

  // Add this function to handle post click navigation
  const handlePostClick = async (postId: string) => {
    // Track view interaction only for authenticated users
    if (user) {
      await trackInteraction({
        postId,
        forumId,
        interactionType: 'view',
        timeSpent: 0
      });
    }
    
    router.push(`/forum/${forumId}/posts/${postId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="relative w-16 h-16">
          <div className="absolute w-16 h-16 rounded-full border-4 border-blue-100 opacity-30"></div>
          <div className="absolute w-16 h-16 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-blue-500">
            <Loader className="w-8 h-8 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-10 px-4 bg-red-50 border border-red-100 rounded-lg shadow-sm"
      >
        <p className="text-red-600">{error}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-semibold text-blue-800"
        >
          Discussion
        </motion.h2>

        {user && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreatePost}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Post</span>
          </motion.button>
        )}
      </div>
      
      {posts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16 px-4 bg-blue-50 rounded-xl border-2 border-dashed border-blue-200"
        >
          <p className="text-blue-600 font-medium">No posts found in this forum. Be the first to start a discussion!</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div 
                key={post._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -3 }}
                className="border border-blue-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white cursor-pointer"
                onClick={() => handlePostClick(post._id)}
              >
                <div className="bg-blue-50 p-5 border-b border-blue-100">
                  <h3 className="text-xl font-medium text-blue-800">{post.title}</h3>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-5">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 shadow-sm">
                      <Image 
                        src={'/user-avatar.png'} 
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">{post.author.name}</p>
                      <p className="text-sm text-blue-500">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                  
                  {/* Display post image if available */}
                  {post.imageUrl && (
                    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative w-full h-80">
                        <Image 
                          src={getImageUrl(post.imageUrl)} 
                          alt={`Image for ${post.title}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="prose max-w-none mt-5">
                    <div 
                      className="whitespace-pre-line text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-8 pt-5 border-t border-blue-50">
                    <div className="flex items-center space-x-6">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LikeDislikeButtons 
                          postId={post._id}
                          initialLikes={post.likes || 0}
                          initialDislikes={post.dislikes || 0}
                          initialLikeStatus={getUserLikeStatus(post)}
                          onUpdate={(newLikes, newDislikes) => 
                            handleLikeUpdate(post._id, newLikes, newDislikes)
                          }
                        />
                      </motion.div>
                      
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostClick(post._id);
                        }}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-medium">{post.replies}</span>
                      </motion.button>

                      {/* View count */}
                      <div className="flex items-center space-x-1 text-gray-500">
                        <span className="text-sm">{post.views || 0} views</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Save Post Button */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <WatchPostButton postId={post._id} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      <CreatePostPopup 
        forumId={forumId}
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}

export default ForumPosts;