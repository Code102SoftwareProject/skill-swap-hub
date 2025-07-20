import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Suggestion from '@/lib/models/Suggestion';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connect();
    const { userId } = await params;
    
    // Admin can see all suggestions including hidden ones
    const suggestions = await Suggestion.find({
      userId,
    })
      .sort({ date: -1 });

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user suggestions', details: (error as Error).message },
      { status: 500 }
    );
  }
} 