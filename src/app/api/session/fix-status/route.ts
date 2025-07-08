import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';

// POST - Fix session status consistency
export async function POST(req: Request) {
  await connect();
  try {
    console.log('Starting session status fix...');
    
    // Get all sessions
    const sessions = await Session.find({});
    console.log(`Found ${sessions.length} sessions to check`);
    
    let updatedCount = 0;
    
    for (let session of sessions) {
      let needsUpdate = false;
      const originalStatus = session.status;
      
      if (session.isAccepted === true && session.status !== 'active') {
        session.status = 'active';
        needsUpdate = true;
      } else if (session.isAccepted === false && session.status !== 'canceled') {
        session.status = 'canceled'; 
        needsUpdate = true;
      } else if (session.isAccepted === null && session.status !== 'pending') {
        session.status = 'pending';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await session.save();
        console.log(`Updated session ${session._id}: ${originalStatus} -> ${session.status} (isAccepted: ${session.isAccepted})`);
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCount} sessions`,
      totalSessions: sessions.length,
      updatedSessions: updatedCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session fix error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
