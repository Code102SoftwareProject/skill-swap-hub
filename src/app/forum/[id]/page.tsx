'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { FileText, MessageSquare, Clock, User, Loader2 } from 'lucide-react';
import { IForum } from '@/lib/models/Forum';
import ForumPosts from '../../../components/ForumPosts';

export default function ForumDetailsPage() {
  const { id } = useParams();
  const [forum, setForum] = useState<IForum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForumDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/forums/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch forum details');
        }
        
        const data = await response.json();
        setForum(data.forum);
      } catch (err) {
        console.error('Error fetching forum details:', err);
        setError('Unable to load forum details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchForumDetails();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Forum Not Found</h2>
          <p className="text-gray-600">The forum you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Forum Header */}
        <div className="relative h-64 w-full">
          <Image
            src={forum.image || '/app-development.png'}
            alt={forum.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold text-white mb-2">{forum.title}</h1>
            <p className="text-gray-200 text-lg">{forum.description}</p>
          </div>
        </div>
        
        {/* Forum Stats */}
        <div className="bg-sky-800 text-white p-4 flex items-center justify-between">
          <div className="flex space-x-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>{forum.posts} Posts</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>{forum.replies} Replies</span>
            </div>
            
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>Last active: {formatDate(forum.lastActive)}</span>
          </div>
        </div>
        
        {/* Forum Content */}
        <div className="p-6">
          <ForumPosts forumId={forum._id} />
        </div>
      </div>
    </div>
  );
}