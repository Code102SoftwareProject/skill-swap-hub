'use client';
import React from 'react';
import { FileText, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const ForumPage = () => {
  const categories = [
    { id: 1, name: 'Web Development Tools', count: 2 },
    { id: 2, name: 'Frontend Frameworks', count: 14 },
    { id: 3, name: 'Backend Languages', count: 3 },
    { id: 4, name: 'Databases & Servers', count: 3 },
    { id: 5, name: 'UX/UI Design', count: 2 },
    { id: 6, name: 'Cybersecurity', count: 3 }
  ];

  const recentPosts = [
    {
      id: 1,
      title: 'Embracing the Magic of React.js',
      author: 'TrailBlazer25',
      date: 'Jan 17 2024',
      content: 'I recently had the opportunity to work with React.js for the first time, and it was quite the adventure.As I delved into this powerful JavaScript...',
      likes: 2,
      timeAgo: '10 months'
    },
    {
      id: 2,
      title: 'Mastering the Art of React.js Craftsmanship',
      author: 'Webcreations907',
      date: 'Jan 17 2024',
      content: 'As a front-end developer, I recently embarked on a journey to deepen my understanding of React.js, and I must say, it has been a captivating......',
      likes: 2,
      timeAgo: '10 months'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 flex gap-6">
      <div className="flex-1 space-y-6">
        {recentPosts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full" />
              <div>
                <div className="font-mediumn text-black">{post.author}</div>
                <div className="text-sm text-black">{post.date}</div>
              </div>
              <button className="ml-auto">•••</button>
            </div>
            
            <h2 className="text-xl font-semibold text-black">{post.title}</h2>
            <p className="text-gray-700">{post.content}</p>
            
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{post.likes}</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">{post.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="w-80 space-y-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Forums</h2>
          <div className="space-y-3">
            {categories.map(category => (
              <Link 
                href={`/forum/${category.id}`} 
                key={category.id}
                className="flex items-center justify-between p-2 hover:bg-blue-100 rounded transition-colors"
              >
                <span>{category.name}</span>
                <span className="text-blue-500">{category.count}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Blog Posts</h2>
          <div className="space-y-3">
            <Link href="#" className="block hover:text-blue-500">
              Mastering Modern JavaScript Frameworks
            </Link>
            <Link href="#" className="block hover:text-blue-500">
              Securing Your Web Applications: Best Practices
            </Link>
            <Link href="#" className="block hover:text-blue-500">
              Building Robust APIs with Node.js and Express
            </Link>
            <Link href="#" className="block hover:text-blue-500">
              Designing Intuitive and Accessible User Interfaces
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;