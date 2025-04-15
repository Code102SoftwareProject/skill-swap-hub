import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import { Forum } from '@/lib/models/Forum';
import mongoose from 'mongoose';

// GET handler for fetching posts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const forumId = id;
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
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const forumId = params.id;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return NextResponse.json(
        { error: 'Invalid forum ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if forum exists
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validate request body
    if (!data.title || !data.content) {
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
      imageUrl: data.imageUrl || null, // Include image URL if provided
      author: {
        // Generate a valid ObjectId instead of using the string
        _id: new mongoose.Types.ObjectId(),
        name: data.author?.name || 'Anonymous User',
        avatar: data.author?.avatar || '/default-avatar.png',
      },
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      replies: 0
    });
    
    await newPost.save();
      
    return NextResponse.json({ 
      success: true,
      post: newPost 
    }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error creating post:', errorMessage, errorStack);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}