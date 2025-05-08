import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import Reply from '@/lib/models/replySchema';
import mongoose from 'mongoose';
import { Forum } from '@/lib/models/Forum';

// GET handler for fetching all replies for a post
export async function GET(request: NextRequest) {
  try {
    // Extract post ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const postId = pathParts[pathParts.length - 2]; // Get the ID from the path
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Get all replies for this post - fix the field name from 'id' to 'postId'
    const replies = await Reply.find({ postId: postId }).sort({ createdAt: 1 });
    
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
export async function POST(request: NextRequest) {
  try {
    // Extract post ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const postId = pathParts[pathParts.length - 2]; // Get the ID from the path
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    // Get data from request body, which now includes user details from the AuthContext
    const { content, author, forumId } = await request.json();
    
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
    
    // Validate forumId if provided
    if (forumId && !mongoose.Types.ObjectId.isValid(forumId)) {
      return NextResponse.json(
        { error: 'Invalid forum ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Create new reply
    const reply = new Reply({
      postId: postId, // Use postId instead of id to match the schema
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
    await Post.findByIdAndUpdate(postId, { $inc: { replies: 1 } });
    
    // Update forum reply count if forumId was provided directly
    let updatedForumId = forumId;
    
    // If forumId wasn't provided directly, try to get it from the post
    if (!updatedForumId && post.forumId) {
      updatedForumId = post.forumId;
    }
    
    // Update the forum if we have a valid forumId
    if (updatedForumId) {
      // Update forum with incremented reply count and updated lastActive timestamp
      await Forum.findByIdAndUpdate(updatedForumId, {
        $inc: { replies: 1 },
        lastActive: new Date().toISOString(),
        updatedAt: new Date()
      });
    }
    
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