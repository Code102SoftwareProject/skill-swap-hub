import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import mongoose from 'mongoose';

// GET handler for fetching current view count of a post
export async function GET(request: NextRequest) {
  try {
    // Extract post ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const postId = pathParts[pathParts.length - 2]; // views is the last part, so -2 for postId
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const post = await Post.findById(postId).select('views');
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      views: post.views || 0 
    });
  } catch (error) {
    console.error('Error fetching post views:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
