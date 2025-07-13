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

// GET - Get personalized feed for user
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
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get user preferences
    const userPreference = await UserPreference.findOne({ userId }).lean() as IUserPreference | null;

    let posts = [];
    let forumObjectIds: mongoose.Types.ObjectId[] = [];
    
    if (userPreference && userPreference.forumInterests && userPreference.forumInterests.length > 0) {
      // Convert string IDs to ObjectIds for MongoDB query
      forumObjectIds = userPreference.forumInterests.map((id: string) => {
        return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
      });

      // Convert watched posts to ObjectIds for aggregation
      const watchedPostIds = (userPreference.watchedPosts || []).map((id: any) => 
        typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
      );

      // Get posts from user's interested forums with scoring
      const interestingPosts = await Post.aggregate([
        {
          $match: {
            forumId: { $in: forumObjectIds },
            $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }]
          }
        },
        {
          $lookup: {
            from: 'forums',
            localField: 'forumId',
            foreignField: '_id',
            as: 'forum'
          }
        },
        {
          $addFields: {
            score: {
              $add: [
                { $multiply: ['$likes', 3] }, // Likes worth 3 points
                { $multiply: ['$replies', 2] }, // Replies worth 2 points
                { $subtract: [0, '$dislikes'] }, // Subtract dislikes
                {
                  $cond: {
                    if: { $in: ['$_id', watchedPostIds] },
                    then: 10, // Watched posts get bonus points
                    else: 0
                  }
                }
              ]
            },
            recency: {
              $subtract: [
                new Date(),
                '$createdAt'
              ]
            }
          }
        },
        {
          $addFields: {
            finalScore: {
              $subtract: [
                '$score',
                { $divide: ['$recency', 86400000] } // Reduce score by 1 per day old
              ]
            }
          }
        },
        { $sort: { finalScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      posts = interestingPosts;
    }

    // If no personalized posts or user has no preferences, get recent popular posts
    if (posts.length < limit) {
      const remainingLimit = limit - posts.length;
      const recentPosts = await Post.find({
        _id: { $nin: posts.map((p: any) => p._id) }, // Exclude already fetched posts
        $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }]
      })
      .populate('forumId', 'title')
      .sort({ 
        likes: -1, 
        replies: -1, 
        createdAt: -1 
      })
      .limit(remainingLimit)
      .lean();

      posts = [...posts, ...recentPosts];
    }

    // Get total count for pagination
    const totalPosts = userPreference && userPreference.forumInterests && userPreference.forumInterests.length > 0
      ? await Post.countDocuments({
          forumId: { $in: forumObjectIds }
        })
      : await Post.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          totalPages: Math.ceil(totalPosts / limit),
          hasNext: page * limit < totalPosts,
          hasPrev: page > 1
        },
        personalized: !!(userPreference && userPreference.forumInterests && userPreference.forumInterests.length > 0)
      }
    });

  } catch (error) {
    console.error('Error fetching personalized feed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch personalized feed'
    }, { status: 500 });
  }
}

// POST - Update feed preferences
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
    const { forumIds, categories, resetPreferences = false } = body;

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

    if (resetPreferences) {
      userPreference.forumInterests = [];
      userPreference.likedCategories = [];
      userPreference.interactionHistory = [];
    } else {
      if (forumIds) {
        userPreference.forumInterests = [...new Set([...userPreference.forumInterests, ...forumIds])];
      }
      
      if (categories) {
        userPreference.likedCategories = [...new Set([...userPreference.likedCategories, ...categories])];
      }
    }

    await userPreference.save();

    return NextResponse.json({
      success: true,
      data: {
        forumInterests: userPreference.forumInterests,
        likedCategories: userPreference.likedCategories
      },
      message: 'Feed preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating feed preferences:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update feed preferences'
    }, { status: 500 });
  }
}
