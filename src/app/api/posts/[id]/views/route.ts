import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import mongoose from 'mongoose';
import PostView from '@/lib/models/PostView';
import jwt from 'jsonwebtoken';

// Helper function to get user ID from token
function getUserIdFromToken(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

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

// POST handler for incrementing view count
export async function POST(request: NextRequest) {
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
    
    // Get user ID from token
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get forum ID from request body
    const body = await request.json();
    const { forumId } = body;
    
    if (!forumId || !mongoose.Types.ObjectId.isValid(forumId)) {
      return NextResponse.json(
        { error: 'Invalid forum ID' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if this is a new view or a recent duplicate
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const existingView = await PostView.findOne({ 
      postId, 
      userId,
      viewedAt: { $gt: fiveMinutesAgo }
    });
    
    // Only increment view count if this is not a recent duplicate view
    if (!existingView) {
      // Update or create post view record
      await PostView.findOneAndUpdate(
        { postId, userId },
        {
          postId,
          userId,
          forumId,
          viewedAt: now,
          deviceType: 'desktop', // Default value
          isComplete: false
        },
        { upsert: true }
      );
      
      // Increment view count on the post
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { views: 1 } },
        { new: true }
      ).select('views');
      
      if (!post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        views: post.views,
        message: 'View count incremented successfully'
      });
    } else {
      // Return current view count without incrementing
      const post = await Post.findById(postId).select('views');
      
      if (!post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        views: post.views,
        message: 'Recent view already recorded'
      });
    }
  } catch (error) {
    console.error('Error updating post views:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
