import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';
import Reply from '@/lib/models/replySchema';
import mongoose from 'mongoose';

// GET handler for fetching a single reply
export async function GET(request: NextRequest) {
  try {
    // Extract post ID and reply ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const replyId = pathParts[pathParts.length - 1]; // Last segment is the reply ID
    const postId = pathParts[pathParts.length - 3]; // Third from last is the post ID
    
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const reply = await Reply.findById(replyId);
    
    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }
    
    // Verify reply belongs to the specified post
    if (reply.postId.toString() !== postId) {
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
export async function PATCH(request: NextRequest) {
  try {
    // Extract post ID and reply ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const replyId = pathParts[pathParts.length - 1]; // Last segment is the reply ID
    const postId = pathParts[pathParts.length - 3]; // Third from last is the post ID
    
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(replyId)) {
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
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Find reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }
    
    // Verify reply belongs to the specified post
    if (reply.postId.toString() !== postId) {
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

// PUT handler for editing a reply
export async function PUT(request: NextRequest) {
  try {
    // Extract post ID and reply ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const replyId = pathParts[pathParts.length - 1]; // Last segment is the reply ID
    const postId = pathParts[pathParts.length - 3]; // Third from last is the post ID
    
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate required data
    if (!data.content || !data.content.trim()) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }
    
    // Need user ID to verify ownership
    if (!data.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }
    
    // Verify reply belongs to the specified post
    if (reply.postId.toString() !== postId) {
      return NextResponse.json(
        { error: 'Reply does not belong to specified post' },
        { status: 400 }
      );
    }
    
    // Check if the user is the author of the reply
    if (reply.author._id.toString() !== data.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You are not the author of this reply' },
        { status: 403 }
      );
    }
    
    // Update reply content
    reply.content = data.content.trim();
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

// DELETE handler for removing a reply
export async function DELETE(request: NextRequest) {
  try {
    // Extract post ID and reply ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const replyId = pathParts[pathParts.length - 1]; // Last segment is the reply ID
    const postId = pathParts[pathParts.length - 3]; // Third from last is the post ID
    
    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Need user ID to verify ownership
    if (!data.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find post to update reply count later
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Find reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }
    
    // Verify reply belongs to the specified post
    if (reply.postId.toString() !== postId) {
      return NextResponse.json(
        { error: 'Reply does not belong to specified post' },
        { status: 400 }
      );
    }
    
    // Check if the user is the author of the reply
    if (reply.author._id.toString() !== data.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You are not the author of this reply' },
        { status: 403 }
      );
    }
    
    // Delete the reply
    await Reply.findByIdAndDelete(replyId);
    
    // Update post reply count
    post.replies = Math.max(0, post.replies - 1);
    await post.save();
    
    return NextResponse.json({ 
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}