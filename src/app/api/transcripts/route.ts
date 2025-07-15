import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Transcript from '@/lib/models/transcriptSchema';

export async function POST(request: NextRequest) {
  try {
    await connect();

    const body = await request.json();
    const { meetingId, userId, userName, content, participants } = body;

    // Validate required fields
    if (!meetingId || !userId || !userName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: meetingId, userId, userName, content' },
        { status: 400 }
      );
    }

    // Create new transcript
    const transcript = new Transcript({
      meetingId,
      userId,
      userName,
      content,
      participants: participants || []
    });

    await transcript.save();

    return NextResponse.json({
      success: true,
      transcriptId: transcript._id,
      message: 'Transcript saved successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving transcript:', error);
    return NextResponse.json(
      { error: 'Failed to save transcript' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');
    const userId = searchParams.get('userId');

    if (!meetingId && !userId) {
      return NextResponse.json(
        { error: 'Either meetingId or userId is required' },
        { status: 400 }
      );
    }

    let query: any = {};
    if (meetingId) query.meetingId = meetingId;
    if (userId) query.userId = userId;

    const transcripts = await Transcript.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 transcripts

    return NextResponse.json({
      success: true,
      transcripts
    });

  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcripts' },
      { status: 500 }
    );
  }
}
