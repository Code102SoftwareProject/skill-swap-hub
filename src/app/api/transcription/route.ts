import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

const ASSEMBLY_AI_API_KEY = process.env.ASSEMBLY_AI_API_KEY || 'd2112fa8ceed4018a81ec5f02382ba4e';

export async function POST(req: NextRequest) {
  try {
    const { action, meetingId, userId } = await req.json();

    if (action === 'start') {
      // Create a new AssemblyAI streaming session token
      const client = new AssemblyAI({
        apiKey: ASSEMBLY_AI_API_KEY,
      });

      // Create a temporary token for the new Universal Streaming API
      const token = await client.streaming.createTemporaryToken({
        expires_in_seconds: 3600, // 1 hour
        max_session_duration_seconds: 7200 // 2 hours max session
      });

      return NextResponse.json({
        success: true,
        token: token,
        sessionId: `${meetingId}-${userId}-${Date.now()}`,
        apiHost: 'streaming.assemblyai.com'
      });
    }

    if (action === 'save') {
      const { transcript, participants, meetingId } = await req.json();
      
      // Here you can save the transcript to your database
      // Similar to your existing saveTranscript function
      
      return NextResponse.json({
        success: true,
        message: 'Transcript saved successfully'
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process transcription request', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
