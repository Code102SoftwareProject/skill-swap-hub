'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Loader, MessageSquare, Flag, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/AuthContext'; 

interface Author {
  _id: string;
  name: string;
  avatar?: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: Author;
  createdAt: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  replies: number;
}

interface Reply {
  _id: string;
  postId: string;
  content: string;
  author: Author;
  createdAt: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
}

const PostDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth(); // Use the auth context
  const postId = params?.postid as string;
  const forumId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch post details
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId) {
        setError('Post ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Add error handling for fetch
        const postResponse = await fetch(`/api/posts/${postId}`);
        
        if (!postResponse.ok) {
          console.error('Post fetch failed with status:', postResponse.status);
          throw new Error(`Failed to fetch post details: ${postResponse.statusText}`);
        }
        
        const postData = await postResponse.json();
        console.log('Post data received:', postData);
        
        if (!postData || !postData.post) {
          throw new Error('Invalid post data received');
        }
        
        setPost(postData.post);
        
        // Fetch replies with better error handling
        try {
          const repliesResponse = await fetch(`/api/posts/${postId}/replies`);
          
          if (!repliesResponse.ok) {
            console.error('Replies fetch failed with status:', repliesResponse.status);
            throw new Error(`Failed to fetch replies: ${repliesResponse.statusText}`);
          }
          
          const repliesData = await repliesResponse.json();
          console.log('Replies data received:', repliesData);
          setReplies(repliesData.replies || []);
        } catch (replyErr) {
          console.error('Error fetching replies:', replyErr);
          // Don't set error state for replies, just log it
          // We still want to show the post even if replies fail
          setReplies([]);
        }
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Unable to load post. Please try again later.');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  const handleBackToForum = () => {
    router.push(`/forum/${forumId}`);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !user) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create an author object from the user in AuthContext
      const author = {
        _id: user._id || user._id, // Depending on how your user object is structured
        name: user.firstName,
        //avatar: user.image || user.avatar // Depending on how your user object is structured
      };
      
      const response = await fetch(`/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Keep the auth token for additional security
        },
        body: JSON.stringify({
          content: replyContent,
          author // Pass the author information from the frontend
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit reply');
      }
      
      const data = await response.json();
      
      // Add new reply to the list
      setReplies((prevReplies) => [...prevReplies, data.reply]);
      
      // Update post reply count
      if (post) {
        setPost({
          ...post,
          replies: post.replies + 1
        });
      }
      
      // Clear reply input
      setReplyContent('');
    } catch (err) {
      console.error('Error submitting reply:', err);
      alert('Failed to submit your reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostLike = async (operation: 'like' | 'dislike' | 'unlike' | 'undislike') => {
    if (!user) {
      alert('Please sign in to like or dislike posts');
      return;
    }
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add auth token
        },
        body: JSON.stringify({
          operation,
          userId: user.email
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      
      const data = await response.json();
      setPost(data.post);
    } catch (err) {
      console.error('Error updating post:', err);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleReplyLike = async (replyId: string, operation: 'like' | 'dislike' | 'unlike' | 'undislike') => {
    if (!user) {
      alert('Please sign in to like or dislike replies');
      return;
    }
    
    try {
      const response = await fetch(`/api/posts/${postId}/replies/${replyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add auth token
        },
        body: JSON.stringify({
          operation,
          userId: user.email
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reply');
      }
      
      const data = await response.json();
      
      // Update replies state
      setReplies(replies.map(reply => 
        reply._id === replyId ? data.reply : reply
      ));
    } catch (err) {
      console.error('Error updating reply:', err);
      alert('Failed to update reply. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid date';
    }
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '/user-avatar.png';
    
    if (imageUrl.startsWith('http')) {
      return `/api/file/retrieve?fileUrl=${encodeURIComponent(imageUrl)}`;
    } else {
      return `/api/file/retrieve?file=${encodeURIComponent(imageUrl)}`;
    }
  };

  // Add debug output for loading state
  console.log('Component state:', { loading, error, post, replies });

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

  if (error || !post) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-10 px-4 bg-red-50 border border-red-100 rounded-lg shadow-sm max-w-4xl mx-auto"
      >
        <p className="text-red-600">{error || 'Post not found'}</p>
        <button 
          onClick={handleBackToForum}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          Back to Forum
        </button>
      </motion.div>
    );
  }

  const isPostLiked = user?.email && post.likedBy.includes(user.email);
  const isPostDisliked = user?.email && post.dislikedBy.includes(user.email);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -5 }}
        onClick={handleBackToForum}
        className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Forum</span>
      </motion.button>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-blue-100 rounded-xl overflow-hidden shadow-md bg-white mb-8"
      >
        {/* Post header */}
        <div className="bg-blue-50 p-6 border-b border-blue-100">
          <h1 className="text-2xl font-semibold text-blue-800">{post.title}</h1>
        </div>
        
        {/* Post content */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 shadow-sm">
              <Image 
                src={post.author.avatar ? getImageUrl(post.author.avatar) : '/user-avatar.png'} 
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
          
          <div className="prose max-w-none">
            <p className="whitespace-pre-line text-gray-700 leading-relaxed">{post.content}</p>
          </div>
          
          {/* Post image if available */}
          {post.imageUrl && (
            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full h-96">
                <Image 
                  src={getImageUrl(post.imageUrl)} 
                  alt={`Image for ${post.title}`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Post actions */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-blue-50">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => handlePostLike(isPostLiked ? 'unlike' : 'like')}
                  className={`flex items-center space-x-1 ${isPostLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'} transition-colors`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>{post.likes}</span>
                </button>
                
                <button 
                  onClick={() => handlePostLike(isPostDisliked ? 'undislike' : 'dislike')}
                  className={`flex items-center space-x-1 ${isPostDisliked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span>{post.dislikes}</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2 text-blue-600">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">{post.replies}</span>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.1 }}
              className="text-blue-400 hover:text-red-500 transition-colors"
            >
              <Flag className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Reply form */}
      {user ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-blue-100 rounded-xl p-6 shadow-md mb-8"
        >
          <h3 className="text-lg font-medium text-blue-800 mb-4">Post a Reply</h3>
          
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Write your reply here..."
              className="w-full p-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all min-h-32"
              required
            />
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                  submitting || !replyContent.trim() 
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                } text-white`}
              >
                {submitting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span>Post Reply</span>
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="bg-blue-50 p-6 rounded-xl text-center mb-8">
          <p className="text-blue-600">Please sign in to post a reply.</p>
        </div>
      )}
      
      {/* Replies section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">
          {replies.length > 0 
            ? `Replies (${replies.length})` 
            : 'No replies yet'
          }
        </h2>
        
        <AnimatePresence>
          {replies.map((reply, index) => {
            const isReplyLiked = user?.email && reply.likedBy.includes(user.email);
            const isReplyDisliked = user?.email && reply.dislikedBy.includes(user.email);
            
            return (
              <motion.div 
                key={reply._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100">
                    <Image 
                      src={reply.author.avatar ? getImageUrl(reply.author.avatar) : '/user-avatar.png'} 
                      alt={reply.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">{reply.author.name}</p>
                    <p className="text-xs text-blue-500">{formatDate(reply.createdAt)}</p>
                  </div>
                </div>
                
                <div className="prose max-w-none ml-14">
                  <p className="whitespace-pre-line text-gray-700">{reply.content}</p>
                </div>
                
                <div className="flex items-center justify-end mt-4 pt-4 border-t border-blue-50">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleReplyLike(reply._id, isReplyLiked ? 'unlike' : 'like')}
                      className={`flex items-center space-x-1 ${isReplyLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'} transition-colors`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{reply.likes}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleReplyLike(reply._id, isReplyDisliked ? 'undislike' : 'dislike')}
                      className={`flex items-center space-x-1 ${isReplyDisliked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{reply.dislikes}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PostDetail;