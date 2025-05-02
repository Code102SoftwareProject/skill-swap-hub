import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Forum } from '@/lib/models/Forum';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const forums = await Forum.find();

    return NextResponse.json({ forums });
  } catch (error) {
    console.error('Error fetching forums:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { title, description, image, lastActive } = body;
    
    if (!title || !description || !image) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const forum = await Forum.create({
      title,
      description,
      image,
      lastActive: lastActive || new Date().toISOString(),
      posts: 0,
      replies: 0
    });
    
    return NextResponse.json(forum, { status: 201 });
  } catch (error) {
    console.error('Error creating forum:', error);
    return NextResponse.json(
      { message: 'Failed to create forum' },
      { status: 500 }
    );
  }
}
