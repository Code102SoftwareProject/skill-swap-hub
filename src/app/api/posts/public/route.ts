import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Post from '@/lib/models/postSchema';
import { Forum } from '@/lib/models/Forum';

// GET - Get public posts (no authentication required)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sort = url.searchParams.get('sort') || 'popular'; // popular, newest, trending
    const forumId = url.searchParams.get('forumId'); // optional filter by forum
    const skip = (page - 1) * limit;

    let query: any = {};
    
    // Filter by forum if specified
    if (forumId) {
      query.forumId = forumId;
    }

    let sortQuery: any = {};
    
    // Define sort options
    switch (sort) {
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'trending':
        sortQuery = { replies: -1, likes: -1, createdAt: -1 };
        break;
      case 'popular':
      default:
        // Score based on engagement
        sortQuery = { likes: -1, replies: -1, createdAt: -1 };
        break;
    }

    // Get posts with forum information (exclude deleted posts)
    const posts = await Post.find({ ...query, $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }] })
      .populate('forumId', 'title description')
      .populate('author', 'firstName lastName email')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform author data to match expected format
    const transformedPosts = posts.map((post: any) => ({
      ...post,
      author: {
        _id: post.author._id,
        name: `${post.author.firstName} ${post.author.lastName}`,
        avatar: post.author.avatar || '/user-avatar.png'
      }
    }));

    // Get total count for pagination
    const totalPosts = await Post.countDocuments(query);

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        hasNext: page * limit < totalPosts,
        hasPrev: page > 1
      },
      sort,
      ...(forumId && { forumId })
    });

  } catch (error) {
    console.error('Error fetching public posts:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch posts'
    }, { status: 500 });
  }
}
