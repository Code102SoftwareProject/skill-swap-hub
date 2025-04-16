'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MessageSquare, Clock, User, Loader2 } from 'lucide-react';
import { IForum } from '@/lib/models/Forum';
import ForumPosts from '../../../components/ForumPosts';
import Navbar from '@/components/Navbar';
import Chatbot from "@/components/chatassistant/chatbot";

export default function ForumDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [forum, setForum] = useState<IForum | null>(null);
  const [latestForums, setLatestForums] = useState<IForum[]>([]);
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch current forum details
        const forumResponse = await fetch(`/api/forums/${id}`);
        if (!forumResponse.ok) {
          throw new Error('Failed to fetch forum details');
        }
        const forumData = await forumResponse.json();
        setForum(forumData.forum);
        
        // Fetch latest forums
        const latestForumsResponse = await fetch('/api/forums?limit=5&sort=createdAt');
        if (!latestForumsResponse.ok) {
          throw new Error('Failed to fetch latest forums');
        }
        const latestForumsData = await latestForumsResponse.json();
        setLatestForums(latestForumsData.forums);
        
        // Fetch latest posts across all forums
        const latestPostsResponse = await fetch('/api/posts?limit=5&sort=createdAt');
        if (!latestPostsResponse.ok) {
          throw new Error('Failed to fetch latest posts');
        }
        const latestPostsData = await latestPostsResponse.json();
        setLatestPosts(latestPostsData.posts);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Unable to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading forum...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <MessageSquare className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <MessageSquare className="h-8 w-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Forum Not Found</h2>
          <p className="text-gray-600">The forum you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Forum Header */}
              <div className="relative h-72 w-full bg-gradient-to-r from-blue-600 to-blue-800">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <div className="flex items-center text-white/80 mb-3 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{forum.createdAt ? formatDate(forum.createdAt) : 'Recently'}</span>
                    
                    <span className="mx-2">•</span>
                    
                    <User className="h-4 w-4 mr-1" />
                    <span>{forum.author?.username || 'Anonymous'}</span>
                  </div>
                  
                  <h1 className="text-4xl font-bold text-white mb-3">{forum.title}</h1>
                  <p className="text-gray-200 text-lg max-w-3xl">{forum.description}</p>
                </div>
                
                {/* Top right decorative pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-bl-full"></div>
                  <div className="absolute top-8 right-8 w-16 h-16 bg-white rounded-bl-full"></div>
                  <div className="absolute top-16 right-16 w-16 h-16 bg-white rounded-bl-full"></div>
                </div>
              </div>
              
              {/* Forum Content */}
              <div className="p-6">
                <ForumPosts forumId={forum._id} />
              </div>
            </div>
          </div>
          
          {/* Sidebar - Now on the right and sticky */}
          <div className="lg:w-1/4 sticky top-6">
            {/* Latest Forums */}
            <div className="bg-blue-100 rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="bg-blue-200 px-4 py-3">
                <h2 className="text-lg font-semibold text-gray-800">Latest Forums</h2>
              </div>
              <div className="divide-y divide-blue-200">
                {latestForums.map((latestForum) => (
                  <div 
                    key={latestForum._id} 
                    className="flex justify-between items-center px-4 py-3 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => navigateToForum(latestForum._id)}
                  >
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium">{latestForum.title}</span>
                      <span className="text-xs text-gray-500">{formatDate(latestForum.createdAt)}</span>
                    </div>
                    <span className="bg-blue-200 text-blue-800 text-sm px-2 py-1 rounded-full">
                      {latestForum.postCount || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Latest Posts */}
            <div className="bg-blue-100 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-blue-200 px-4 py-3">
                <h2 className="text-lg font-semibold text-gray-800">Latest Posts</h2>
              </div>
              <div className="divide-y divide-blue-200">
                {latestPosts.map((post) => (
                  <div key={post._id} className="px-4 py-3 hover:bg-blue-50 transition-colors">
                    <Link href={`/forum/${post.forumId}/posts/${post._id}`} className="text-gray-700 hover:text-blue-600 block">
                      <div className="font-medium line-clamp-1">{post.title || 'Untitled Post'}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <User className="h-3 w-3 mr-1" />
                        <span>{post.author?.name || 'Anonymous'}</span>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Chatbot />
        </div>
      </div>
    </div>
  );
}