// File: /app/api/posts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import mongoose from 'mongoose';

// GET handler for fetching a single post
export async function GET(request: NextRequest) {
  try {
    // Extract post ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const postId = pathParts[pathParts.length - 1];
    
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

// PUT handler for updating an entire post
export async function PUT(request: NextRequest) {
  try {
    // Extract post ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const postId = pathParts[pathParts.length - 1];
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate request body
    if (!data.title || !data.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Need user ID to verify post ownership
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
    
    // Check if user is the author of the post
    // Assuming the author's ID is stored in post.author._id
    if (post.author._id.toString() !== data.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own posts' },
        { status: 403 }
      );
    }
    
    // Update post fields
    post.title = data.title;
    post.content = data.content;
    
    // Update image URL if provided
    if (data.imageUrl !== undefined) {
      post.imageUrl = data.imageUrl;
    }
    
    // Save the updated post
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

// PATCH handler for updating post (likes, dislikes)
export async function PATCH(request: NextRequest) {
  try {
    // Extract post ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const postId = pathParts[pathParts.length - 1];
    
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

// DELETE handler for removing a post
export async function DELETE(request: NextRequest) {
  try {
    // Extract post ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const postId = pathParts[pathParts.length - 1];
    
    // Validate MongoDB ObjectId for post ID
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    // Get user ID from request body instead of search params
    const data = await request.json();
    const userId = data.userId;
    
    // Validate that user ID was provided
    if (!userId) {
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
    
    // Check if user is the author of the post
    if (post.author._id.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own posts' },
        { status: 403 }
      );
    }
    
    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}