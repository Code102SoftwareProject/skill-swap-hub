import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import { Forum } from '@/lib/models/Forum';
import mongoose from 'mongoose';

// GET handler for fetching posts
export async function GET(request: NextRequest) {
  try {
    // Extract the forum ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const forumId = pathParts[pathParts.length - 2]; 
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return NextResponse.json(
        { error: 'Invalid forum ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const posts = await Post.find({ forumId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ forumId });

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for creating new posts
export async function POST(request: NextRequest) {
  // Use a session to ensure both operations (post creation and forum update) succeed or fail together
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Extract the forum ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const forumId = pathParts[pathParts.length - 2]; 
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return NextResponse.json(
        { error: 'Invalid forum ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if forum exists
    const forum = await Forum.findById(forumId).session(session);
    if (!forum) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validate request body
    if (!data.title || !data.content) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Create new post with optional image URL
    const newPost = new Post({
      forumId,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl || null,
      author: {
        _id: data.author?._id || new mongoose.Types.ObjectId(),
        name: data.author?.name || 'Anonymous User',
        avatar: data.author?.avatar || '/default-avatar.png',
      },
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      replies: 0
    });
    
    // Save the post with the session
    await newPost.save({ session });
    
    // Update forum post count and lastActive time
    await Forum.findByIdAndUpdate(
      forumId,
      { 
        $inc: { posts: 1 },
        lastActive: new Date().toISOString()
      },
      { session }
    );
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
      
    return NextResponse.json({ 
      success: true,
      post: newPost 
    }, { status: 201 });
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    session.endSession();
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error creating post:', errorMessage, errorStack);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}