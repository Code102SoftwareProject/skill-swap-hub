import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Meeting from '@/lib/models/meetingSchema';
import MeetingNotes from '@/lib/models/meetingNotesSchema';

export async function GET(req: NextRequest) {
  await connect();
  
  try {
    // Add some basic security - you might want to add proper authentication
    const url = new URL(req.url);
    const secretKey = url.searchParams.get('key');
    
    if (secretKey !== process.env.CLEANUP_SECRET_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Calculate date 2 weeks ago
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    console.log(`Starting cleanup for meetings older than: ${twoWeeksAgo.toISOString()}`);
    
    // Find meetings older than 2 weeks
    const oldMeetings = await Meeting.find({
      meetingTime: { $lt: twoWeeksAgo },
      state: { $in: ['completed', 'cancelled', 'rejected'] } // Only cleanup finished meetings
    });
    
    console.log(`Found ${oldMeetings.length} meetings to cleanup`);
    
    let deletedCount = 0;
    let preservedNotesCount = 0;
    
    for (const meeting of oldMeetings) {
      // Check if there are any notes for this meeting
      const notesExist = await MeetingNotes.findOne({ meetingId: meeting._id.toString() });
      
      if (notesExist) {
        // Update notes to indicate meeting was removed but preserve the notes
        await MeetingNotes.updateMany(
          { meetingId: meeting._id.toString() },
          { 
            $set: { 
              meetingInfo: {
                description: meeting.description || 'Removed Meeting',
                meetingTime: meeting.meetingTime,
                senderId: meeting.senderId,
                receiverId: meeting.receiverId,
                isDeleted: true
              }
            }
          }
        );
        preservedNotesCount++;
        console.log(`Preserved notes for deleted meeting: ${meeting._id}`);
      }
      
      // Delete the meeting
      await Meeting.findByIdAndDelete(meeting._id);
      deletedCount++;
    }
    
    console.log(`Cleanup completed: ${deletedCount} meetings deleted, ${preservedNotesCount} note records preserved`);
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedMeetings: deletedCount,
      preservedNotes: preservedNotesCount,
      cleanupDate: twoWeeksAgo.toISOString()
    });
    
  } catch (error: any) {
    console.error('Error during meeting cleanup:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to cleanup meetings', 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
