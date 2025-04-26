import React from 'react';
interface Post {
    _id: string;
    title: string;
    content: string;
    author: string;
    createdAt: Date;
  }

interface PostsListProps {
  posts: Post[];
  title: string;
}

export default function PostsList({ posts, title }: PostsListProps) {
  if (!posts || posts.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post._id} className="border-b pb-4">
            <h3 className="font-bold">{post.title}</h3>
            <p className="text-sm text-gray-600 mb-2">
              By {post.author} • {new Date(post.createdAt).toLocaleDateString()}
            </p>
            <p className="line-clamp-3">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
