import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';

// GET - Debug session data
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId required' },
        { status: 400 }
      );
    }

    // Get raw session data
    const sessions = await Session.find({
      $or: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    }).lean(); // Use lean() for raw data

    console.log('Debug - Raw sessions:', sessions.map(s => ({
      _id: s._id,
      isAccepted: s.isAccepted,
      status: s.status,
      user1Id: s.user1Id,
      user2Id: s.user2Id
    })));

    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        _id: s._id,
        isAccepted: s.isAccepted,
        status: s.status,
        user1Id: s.user1Id,
        user2Id: s.user2Id,
        startDate: s.startDate,
        createdAt: s.createdAt
      }))
    }, { status: 200 });

  } catch (error: any) {
    console.error('Debug API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
