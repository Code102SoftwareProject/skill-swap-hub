import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import Reply from '@/lib/models/replySchema';
import mongoose from 'mongoose';

// GET handler for fetching a single reply
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, replyid: string } }
) {
  try {
    const { id, replyid } = params;
    
    
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(replyid)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const reply = await Reply.findById(replyid);
    
    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }
    
    // Verify reply belongs to the specified post
    if (reply.postId.toString() !== id) {
      return NextResponse.json(
        { error: 'Reply does not belong to specified post' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error fetching reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating reply (likes, dislikes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, replyid: string } }
) {
  try {
    const { id, replyid } = params;
   
    
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(replyid)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate operation type
    if (!data.operation || !['like', 'dislike', 'unlike', 'undislike'].includes(data.operation)) {
      return NextResponse.json(
        { error: 'Invalid operation type' },
        { status: 400 }
      );
    }
    
    // Need user ID to track who liked/disliked
    if (!data.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
    
    // Find reply
    const reply = await Reply.findById(replyid);
    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }
    
    // Verify reply belongs to the specified post
    if (reply.postId.toString() !== id) {
      return NextResponse.json(
        { error: 'Reply does not belong to specified post' },
        { status: 400 }
      );
    }
    
    // Handle different operations
    const userId = data.userId;
    
    switch (data.operation) {
      case 'like':
        // If user already liked, do nothing
        if (reply.likedBy.includes(userId)) {
          return NextResponse.json({ reply });
        }
        
        // If user previously disliked, remove from dislikedBy and decrement dislikes
        if (reply.dislikedBy.includes(userId)) {
          reply.dislikedBy = reply.dislikedBy.filter((id: string) => id !== userId);
          reply.dislikes = Math.max(0, reply.dislikes - 1);
        }
        
        // Add user to likedBy and increment likes
        reply.likedBy.push(userId);
        reply.likes += 1;
        break;
        
      case 'dislike':
        // If user already disliked, do nothing
        if (reply.dislikedBy.includes(userId)) {
          return NextResponse.json({ reply });
        }
        
        // If user previously liked, remove from likedBy and decrement likes
        if (reply.likedBy.includes(userId)) {
          reply.likedBy = reply.likedBy.filter((id: string) => id !== userId);
          reply.likes = Math.max(0, reply.likes - 1);
        }
        
        // Add user to dislikedBy and increment dislikes
        reply.dislikedBy.push(userId);
        reply.dislikes += 1;
        break;
        
      case 'unlike':
        // Remove user from likedBy if present
        if (reply.likedBy.includes(userId)) {
          reply.likedBy = reply.likedBy.filter((id: string) => id !== userId);
          reply.likes = Math.max(0, reply.likes - 1);
        }
        break;
        
      case 'undislike':
        // Remove user from dislikedBy if present
        if (reply.dislikedBy.includes(userId)) {
          reply.dislikedBy = reply.dislikedBy.filter((id: string) => id !== userId);
          reply.dislikes = Math.max(0, reply.dislikes - 1);
        }
        break;
    }
    
    await reply.save();
    
    return NextResponse.json({ 
      success: true,
      reply
    });
  } catch (error) {
    console.error('Error updating reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}