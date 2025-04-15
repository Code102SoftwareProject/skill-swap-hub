// File: /app/api/posts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import mongoose from 'mongoose';

// GET handler for fetching a single post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is awaited before accessing its properties
    const { id } = await params;
    const postId = id;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating post (likes, dislikes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is awaited before accessing its properties
    const { id } = await params;
    const postId = id;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate operation type
    if (!data.operation || !['like', 'dislike', 'unlike', 'undislike'].includes(data.operation)) {
      return NextResponse.json(
        { error: 'Invalid operation type' },
        { status: 400 }
      );
    }
    
    // Need user ID to track who liked/disliked
    if (!data.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Handle different operations
    const userId = data.userId;
    
    switch (data.operation) {
      case 'like':
        // If user already liked, do nothing
        if (post.likedBy.includes(userId)) {
          return NextResponse.json({ post });
        }
        
        // If user previously disliked, remove from dislikedBy and decrement dislikes
        if (post.dislikedBy.includes(userId)) {
          post.dislikedBy = post.dislikedBy.filter((id: string) => id !== userId);
          post.dislikes = Math.max(0, post.dislikes - 1);
        }
        
        // Add user to likedBy and increment likes
        post.likedBy.push(userId);
        post.likes += 1;
        break;
        
      case 'dislike':
        // If user already disliked, do nothing
        if (post.dislikedBy.includes(userId)) {
          return NextResponse.json({ post });
        }
        
        // If user previously liked, remove from likedBy and decrement likes
        if (post.likedBy.includes(userId)) {
          post.likedBy = post.likedBy.filter((id: string) => id !== userId);
          post.likes = Math.max(0, post.likes - 1);
        }
        
        // Add user to dislikedBy and increment dislikes
        post.dislikedBy.push(userId);
        post.dislikes += 1;
        break;
        
      case 'unlike':
        // Remove user from likedBy if present
        if (post.likedBy.includes(userId)) {
          post.likedBy = post.likedBy.filter((id: string) => id !== userId);
          post.likes = Math.max(0, post.likes - 1);
        }
        break;
        
      case 'undislike':
        // Remove user from dislikedBy if present
        if (post.dislikedBy.includes(userId)) {
          post.dislikedBy = post.dislikedBy.filter((id: string) => id !== userId);
          post.dislikes = Math.max(0, post.dislikes - 1);
        }
        break;
    }
    
    await post.save();
    
    return NextResponse.json({ 
      success: true,
      post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}