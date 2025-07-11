import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import UserPreference from '@/lib/models/UserPreference';
import PostView from '@/lib/models/PostView';
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

// POST - Track user interaction with a post
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
    const { 
      postId, 
      forumId, 
      interactionType, 
      timeSpent = 0,
      deviceType = 'desktop',
      isComplete = false 
    } = body;

    console.log('Interaction tracking request:', { postId, forumId, interactionType, userId });

    if (!postId || !forumId || !interactionType) {
      console.error('Missing required fields:', { postId, forumId, interactionType });
      return NextResponse.json({
        success: false,
        message: 'Post ID, Forum ID, and interaction type are required',
        details: {
          postId: !!postId,
          forumId: !!forumId,
          interactionType: !!interactionType
        }
      }, { status: 400 });
    }

    // Validate ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(postId)) {
      console.error('Invalid postId format:', postId);
      return NextResponse.json({
        success: false,
        message: 'Invalid post ID format'
      }, { status: 400 });
    }

    if (!objectIdRegex.test(forumId)) {
      console.error('Invalid forumId format:', forumId);
      return NextResponse.json({
        success: false,
        message: 'Invalid forum ID format'
      }, { status: 400 });
    }

    // Validate interaction type
    const validInteractionTypes = ['view', 'like', 'dislike', 'comment', 'share'];
    if (!validInteractionTypes.includes(interactionType)) {
      console.error('Invalid interaction type:', interactionType);
      return NextResponse.json({
        success: false,
        message: 'Invalid interaction type'
      }, { status: 400 });
    }

    // Create or update user preferences
    let userPreference;
    try {
      userPreference = await UserPreference.findOne({ userId });
    } catch (error) {
      console.error('Error finding user preference:', error);
      throw new Error('Failed to find user preferences');
    }
    
    if (!userPreference) {
      try {
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
        console.log('Created new user preference for user:', userId);
      } catch (error) {
        console.error('Error creating user preference:', error);
        throw new Error('Failed to create user preferences');
      }
    }

    // Add to interaction history (limit to last 1000 interactions to prevent bloat)
    const newInteraction = {
      postId,
      forumId,
      interactionType,
      timestamp: new Date(),
      timeSpent
    };

    userPreference.interactionHistory.unshift(newInteraction);
    
    // Keep only last 1000 interactions
    if (userPreference.interactionHistory.length > 1000) {
      userPreference.interactionHistory = userPreference.interactionHistory.slice(0, 1000);
    }

    // Add forum to interests if not already there (for view interactions)
    if (interactionType === 'view' && !userPreference.forumInterests.includes(forumId)) {
      userPreference.forumInterests.push(forumId);
    }

    try {
      await userPreference.save();
      console.log('Successfully saved user preference with interaction');
    } catch (error) {
      console.error('Error saving user preference:', error);
      throw new Error('Failed to save user preferences');
    }

    // Track post view separately for analytics
    if (interactionType === 'view') {
      try {
        await PostView.findOneAndUpdate(
          { postId, userId },
          {
            postId,
            userId,
            forumId,
            viewedAt: new Date(),
            timeSpent,
            deviceType,
            isComplete
          },
          { upsert: true, new: true }
        );
        console.log('Successfully tracked post view');
      } catch (error) {
        console.error('Error tracking post view:', error);
        // Don't throw here as the main interaction tracking succeeded
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking interaction:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({
      success: false,
      message: 'Failed to track interaction',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get user's interaction analytics
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
    
    const userPreference = await UserPreference.findOne({ userId }).lean();
    
    if (!userPreference) {
      return NextResponse.json({
        success: true,
        data: {
          totalInteractions: 0,
          recentInteractions: [],
          topForums: [],
          interactionTypes: {}
        }
      });
    }

    // Analyze recent interactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInteractions = (userPreference as any).interactionHistory.filter(
      (interaction: any) => new Date(interaction.timestamp) >= thirtyDaysAgo
    );

    // Count interaction types
    const interactionTypes = recentInteractions.reduce((acc: Record<string, number>, interaction: any) => {
      acc[interaction.interactionType] = (acc[interaction.interactionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find top forums
    const forumCounts = recentInteractions.reduce((acc: Record<string, number>, interaction: any) => {
      const forumId = interaction.forumId.toString();
      acc[forumId] = (acc[forumId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topForums = Object.entries(forumCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([forumId, count]) => ({ forumId, count }));

    return NextResponse.json({
      success: true,
      data: {
        totalInteractions: (userPreference as any).interactionHistory.length,
        recentInteractions: recentInteractions.slice(0, 20), // Last 20 interactions
        topForums,
        interactionTypes,
        forumInterests: (userPreference as any).forumInterests
      }
    });

  } catch (error) {
    console.error('Error fetching interaction analytics:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch analytics'
    }, { status: 500 });
  }
}
