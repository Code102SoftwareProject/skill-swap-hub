import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/postSchema';

// GET handler to fetch all posts
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const posts = await Post.find({ 
      $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }] 
    }).sort({ createdAt: -1 }); 

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}