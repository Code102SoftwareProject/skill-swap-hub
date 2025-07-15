import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import UserPreference, { IUserPreference } from '@/lib/models/UserPreference';
import Post from '@/lib/models/postSchema';
import { Forum } from '@/lib/models/Forum';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Ensure JWT_SECRET is available
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Helper function to get user ID from token
function getUserIdFromToken(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('No authorization header found');
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Authorization header does not start with Bearer');
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      console.log('Token is empty, null, or undefined:', token);
      return null;
    }

    // Additional validation for token format
    if (token.split('.').length !== 3) {
      console.log('Token does not have valid JWT format (should have 3 parts):', token);
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// POST - Watch/Unwatch a post
export async function POST(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ 
      success: false, 
      message: 'Unauthorized' 
    }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { postId, action } = body; // action: 'watch' or 'unwatch'

    if (!postId || !action) {
      return NextResponse.json({
        success: false,
        message: 'Post ID and action are required'
      }, { status: 400 });
    }

    let userPreference = await UserPreference.findOne({ userId });
    
    if (!userPreference) {
      userPreference = await UserPreference.create({
        userId,
        forumInterests: [],
        watchedPosts: [],
        likedCategories: [],
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          digestFrequency: 'weekly'
        },
        interactionHistory: []
      });
    }

    if (action === 'watch') {
      // Add to watched posts if not already watching
      if (!userPreference.watchedPosts.includes(postId)) {
        userPreference.watchedPosts.push(postId);
      }
    } else if (action === 'unwatch') {
      // Remove from watched posts
      userPreference.watchedPosts = userPreference.watchedPosts.filter(
        (id: mongoose.Types.ObjectId) => id.toString() !== postId
      );
    }

    await userPreference.save();

    return NextResponse.json({
      success: true,
      data: {
        watchedPosts: userPreference.watchedPosts,
        isWatching: action === 'watch'
      },
      message: `Post ${action === 'watch' ? 'added to' : 'removed from'} saved posts`
    });

  } catch (error) {
    console.error('Error updating post watch status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update watch status'
    }, { status: 500 });
  }
}

// GET - Get user's watched posts
export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ 
      success: false, 
      message: 'Unauthorized' 
    }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Ensure models are loaded
    if (!mongoose.models.Post) {
      throw new Error('Post model not loaded');
    }
    if (!mongoose.models.Forum) {
      throw new Error('Forum model not loaded');
    }
    
    const userPreference = await UserPreference.findOne({ userId })
      .populate({
        path: 'watchedPosts',
        select: 'title content forumId author createdAt likes dislikes replies views',
        populate: {
          path: 'forumId',
          select: 'title'
        }
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: (userPreference as any)?.watchedPosts || []
    });

  } catch (error) {
    console.error('Error fetching watched posts:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch watched posts'
    }, { status: 500 });
  }
}
