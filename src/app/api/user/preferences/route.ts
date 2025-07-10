import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import UserPreference from '@/lib/models/UserPreference';
import jwt from 'jsonwebtoken';

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

// GET - Fetch user preferences
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
    
    let userPreference = await UserPreference.findOne({ userId })
      .populate('watchedPosts', 'title content forumId author createdAt')
      .lean();
    
    // Create default preferences if they don't exist
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

    return NextResponse.json({
      success: true,
      data: userPreference
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch preferences'
    }, { status: 500 });
  }
}

// POST - Update user preferences
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
    const { preferences, forumInterests, likedCategories } = body;

    const updatedPreference = await UserPreference.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(preferences && { preferences }),
          ...(forumInterests && { forumInterests }),
          ...(likedCategories && { likedCategories })
        }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedPreference,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update preferences'
    }, { status: 500 });
  }
}
