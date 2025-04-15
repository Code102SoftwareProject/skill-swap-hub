import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import Reply from '@/lib/models/replySchema';
import mongoose from 'mongoose';

// GET handler for fetching all replies for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Verify post exists
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Get all replies for this post - fix the field name from 'id' to 'postId'
    const replies = await Reply.find({ postId: id }).sort({ createdAt: 1 });
    
    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for creating a new reply
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    // Get data from request body, which now includes user details from the AuthContext
    const { content, author } = await request.json();
    
    // Validate content
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }
    
    // Validate author information from the frontend AuthContext
    if (!author || !author._id || !author.name) {
      return NextResponse.json(
        { error: 'Author information is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Verify post exists
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Create new reply
    const reply = new Reply({
      postId: id, // Use postId instead of id to match the schema
      content: content.trim(),
      author: {
        _id: author._id,
        name: author.name,
        avatar: author.avatar || undefined,
      },
      createdAt: new Date(),
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
    });
    
    await reply.save();
    
    // Increment reply count on the parent post
    await Post.findByIdAndUpdate(id, { $inc: { replies: 1 } });
    
    return NextResponse.json(
      { success: true, reply },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}