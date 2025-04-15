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
