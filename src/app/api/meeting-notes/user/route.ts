import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import MeetingNotes from '@/lib/models/meetingNotesSchema';
import Meeting from '@/lib/models/meetingSchema';

export async function GET(req: NextRequest) {
  await connect();
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const otherUserId = url.searchParams.get('otherUserId');
    
    if (!userId) {
      return NextResponse.json({ message: 'Missing userId parameter' }, { status: 400 });
    }
    
    let query: any = { userId };
    
    // If otherUserId is provided, only get notes for meetings with that specific user
    if (otherUserId) {
      // First find all meetings between these two users
      const meetings = await Meeting.find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      }).select('_id');
      
      const meetingIds = meetings.map(m => m._id.toString());
      query.meetingId = { $in: meetingIds };
    }
    
    const notes = await MeetingNotes.find(query)
      .sort({ lastModified: -1 })
      .lean();
    
    // Process notes - some may have deleted meetings
    const processedNotes = [];
    
    for (const note of notes) {
      if (!note.content || note.content.trim().length === 0) {
        continue; // Skip empty notes
      }
      
      let meetingInfo = null;
      
      // Check if note has embedded meeting info (from deleted meetings)
      if (note.meetingInfo) {
        meetingInfo = note.meetingInfo;
      } else {
        // Try to populate from existing meeting
        try {
          const meeting = await Meeting.findById(note.meetingId).lean();
          if (meeting) {
            meetingInfo = {
              description: (meeting as any).description,
              meetingTime: (meeting as any).meetingTime,
              senderId: (meeting as any).senderId,
              receiverId: (meeting as any).receiverId,
              isDeleted: false
            };
          } else {
            // Meeting was deleted but no embedded info
            meetingInfo = {
              description: 'Removed Meeting',
              meetingTime: note.createdAt, // Fallback to note creation date
              senderId: 'unknown',
              receiverId: 'unknown',
              isDeleted: true
            };
          }
        } catch (err) {
          console.error('Error fetching meeting for note:', err);
          meetingInfo = {
            description: 'Removed Meeting',
            meetingTime: note.createdAt,
            senderId: 'unknown',
            receiverId: 'unknown',
            isDeleted: true
          };
        }
      }
      
      processedNotes.push({
        _id: note._id,
        meetingId: note.meetingId,
        title: note.title,
        content: note.content,
        tags: note.tags,
        wordCount: note.wordCount,
        lastModified: note.lastModified,
        createdAt: note.createdAt,
        isPrivate: note.isPrivate,
        meetingInfo
      });
    }
    
    return NextResponse.json(processedNotes);
  } catch (error: any) {
    console.error('Error fetching user meeting notes:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
