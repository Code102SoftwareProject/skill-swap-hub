import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import MeetingNotes from '@/lib/models/meetingNotesSchema';

export async function GET(req: NextRequest) {
  await connect();
  try {
    const url = new URL(req.url);
    const meetingId = url.searchParams.get('meetingId');
    const userId = url.searchParams.get('userId');
    
    if (!meetingId || !userId) {
      return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }
    
    const notes = await MeetingNotes.findOne({ meetingId, userId });
    return NextResponse.json(notes || { content: '', title: 'Meeting Notes' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connect();
  try {
    const { meetingId, userId, userName, content, title, tags, isPrivate } = await req.json();
    
    if (!meetingId || !userId || !userName) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Calculate word count
    const wordCount = content ? content.trim().split(/\s+/).filter((word: string) => word.length > 0).length : 0;
    
    const notes = await MeetingNotes.findOneAndUpdate(
      { meetingId, userId },
      {
        meetingId,
        userId,
        userName,
        content: content || '',
        title: title || 'Meeting Notes',
        tags: tags || [],
        isPrivate: isPrivate ?? true,
        wordCount,
        lastModified: new Date(),
        $inc: { autoSaveCount: 1 }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('Meeting notes save error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await connect();
  try {
    const url = new URL(req.url);
    const meetingId = url.searchParams.get('meetingId');
    const userId = url.searchParams.get('userId');
    
    if (!meetingId || !userId) {
      return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }
    
    await MeetingNotes.findOneAndDelete({ meetingId, userId });
    return NextResponse.json({ message: 'Notes deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
