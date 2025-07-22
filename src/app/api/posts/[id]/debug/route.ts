import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import PostView from '@/lib/models/PostView';
import mongoose from 'mongoose';

// GET handler for debugging view counts
export async function GET(request: NextRequest) {
  try {
    // Extract post ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const postId = pathParts[pathParts.length - 2]; // debug is the last part, so -2 for postId
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Get post with view count
    const post = await Post.findById(postId).select('title views');
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get all PostView records for this post
    const postViews = await PostView.find({ postId }).select('userId viewedAt timeSpent deviceType');
    
    // Get unique viewers count
    const uniqueViewers = await PostView.distinct('userId', { postId });
    
    return NextResponse.json({ 
      postId,
      postTitle: post.title,
      viewCountInPost: post.views || 0,
      totalPostViewRecords: postViews.length,
      uniqueViewers: uniqueViewers.length,
      postViewRecords: postViews,
      debug: {
        message: 'View count in Post model should equal unique viewers count',
        isConsistent: (post.views || 0) === uniqueViewers.length
      }
    });
  } catch (error) {
    console.error('Error fetching view debug info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
