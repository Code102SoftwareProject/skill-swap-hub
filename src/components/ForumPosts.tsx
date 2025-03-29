'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, ThumbsUp, MessageSquare, Flag, PlusCircle } from 'lucide-react';
import CreatePostPopup from './CreatePostPopup';

interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  replies: number;
}

interface ForumPostsProps {
  forumId: string;
}

const ForumPosts: React.FC<ForumPostsProps> = ({ forumId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const fetchPosts = async () => {
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
  };

  useEffect(() => {
    if (forumId) {
      fetchPosts();
    }
  }, [forumId]);

  const handleCreatePost = () => {
    setIsCreatePostOpen(true);
  };

  const handlePostCreated = () => {
    // Refresh the posts after a new one is created
    fetchPosts();
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

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Discussion</h2>
        <button 
          onClick={handleCreatePost}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create Post
        </button>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">No posts found in this forum. Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="text-xl font-medium text-gray-800">{post.title}</h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image 
                      src={post.author.avatar || '/default-avatar.png'} 
                      alt={post.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{post.author.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                  </div>
                </div>
                
                <div className="prose max-w-none mt-4">
                  <p className="whitespace-pre-line">{post.content}</p>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                      <ThumbsUp className="w-5 h-5" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                      <MessageSquare className="w-5 h-5" />
                      <span>{post.replies}</span>
                    </button>
                  </div>
                  
                  <button className="text-gray-500 hover:text-red-500">
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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