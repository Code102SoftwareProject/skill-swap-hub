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
    
    // Get user ID from token or generate a temporary ID from IP and user agent
    let userId = getUserIdFromToken(request);
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const userAgent = request.headers.get('user-agent') || 'unknown-agent';
    
    // If no authenticated user, create a visitor ID from IP and user agent
    const visitorId = userId || `visitor-${ip}-${userAgent.substring(0, 50)}`;
    
    // Get forum ID from request body
    const body = await request.json();
    const { forumId, noRefresh = false } = body;
    
    if (!forumId || !mongoose.Types.ObjectId.isValid(forumId)) {
      return NextResponse.json(
        { error: 'Invalid forum ID' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if this is a new view or a recent duplicate
    // Reduced cooldown to 1 minute to allow more frequent view counts
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
    
    const existingView = await PostView.findOne({ 
      postId, 
      $or: [
        { userId: visitorId },
        { visitorId: visitorId }
      ],
      viewedAt: { $gt: oneMinuteAgo }
    });
    
    let post;
    
    // Only increment view count if this is not a recent duplicate view
    if (!existingView) {
      // Update or create post view record
      await PostView.findOneAndUpdate(
        { 
          postId, 
          $or: [
            { userId: visitorId },
            { visitorId: visitorId }
          ]
        },
        {
          postId,
          userId: userId || null,
          visitorId: userId ? null : visitorId,
          forumId,
          viewedAt: now,
          deviceType: 'desktop', // Default value
          isComplete: false
        },
        { upsert: true }
      );
      
      // Increment view count on the post
      post = await Post.findByIdAndUpdate(
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
      
      // Set cache-control headers to prevent page refresh issues
      const headers = new Headers();
      headers.append('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.append('Pragma', 'no-cache');
      headers.append('Expires', '0');
      
      return NextResponse.json({
        success: true,
        views: post.views,
        message: 'View count incremented successfully',
        updated: true,
        noRefresh: noRefresh
      }, { 
        status: 200,
        headers: headers
      });
    } else {
      // Always fetch the latest view count from the database
      post = await Post.findById(postId).select('views');
      
      if (!post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      
      // Set cache-control headers to prevent page refresh issues
      const headers = new Headers();
      headers.append('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.append('Pragma', 'no-cache');
      headers.append('Expires', '0');
      
      return NextResponse.json({
        success: true,
        views: post.views,
        message: 'Recent view already recorded',
        updated: false,
        noRefresh: noRefresh
      }, { 
        status: 200,
        headers: headers
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
