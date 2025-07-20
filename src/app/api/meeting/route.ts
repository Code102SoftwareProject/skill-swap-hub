import meetingSchema from "@/lib/models/meetingSchema";
import { NextResponse } from "next/server";
import connect from "@/lib/db";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

// Daily.co configuration
const DAILY_API_KEY = process.env.DAILY_API_KEY || "30a32b5fc8651595f2b981d1210cdd8b9e5b9caececb714da81b825a18f6aa11";
const DAILY_DOMAIN = "skillswaphubcode.daily.co";

/**
 * Function to create a Daily.co room
 * @param {Date} meetingTime - Time when the meeting should start
 * @returns {string} - Daily.co room URL
 */
const createDailyRoom = async (meetingTime: Date) => {
  try {
    console.log('Creating Daily.co room...');
    console.log('API Key:', DAILY_API_KEY ? `${DAILY_API_KEY.slice(0, 10)}...` : 'Missing');
    
    const roomName = `skillswap-${Date.now()}`;
    
    console.log('Room details:', { roomName, meetingTime });
    
    // First, let's try creating a simple room without complex config
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public'
      })
    });

    console.log('Daily.co API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Daily.co room creation error:', response.status, errorText);
      
      // If Daily.co fails, create a simple meeting link as fallback
      console.log('Creating fallback meeting link...');
      const fallbackUrl = `https://${DAILY_DOMAIN}/${roomName}`;
      console.log('Fallback URL created:', fallbackUrl);
      return fallbackUrl;
    }

    const roomData = await response.json();
    console.log('Daily.co room created successfully:', roomData);
    
    // Return the room URL - it should be in the format https://domain.daily.co/roomname
    const roomUrl = roomData.url || `https://${DAILY_DOMAIN}/${roomData.name}`;
    console.log('Final room URL:', roomUrl);
    return roomUrl;
    
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    
    // Fallback: create a simple room URL
    const fallbackRoomName = `skillswap-${Date.now()}`;
    const fallbackUrl = `https://${DAILY_DOMAIN}/${fallbackRoomName}`;
    console.log('Using fallback URL due to error:', fallbackUrl);
    return fallbackUrl;
  }
};

/**
 * Test function to verify Daily.co API connectivity
 */
const testDailyAPI = async () => {
  try {
    console.log('Testing Daily.co API connectivity...');
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });
    
    console.log('Daily.co API Test Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Daily.co API Test Success. Existing rooms count:', data.data?.length || 0);
      return true;
    } else {
      const errorText = await response.text();
      console.error('Daily.co API Test Failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('Daily.co API Test Error:', error);
    return false;
  }
};

export async function GET(req: Request) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const tokenResult = validateAndExtractUserId(req as any);
    if (!tokenResult.isValid) {
      return NextResponse.json({ 
        message: "Unauthorized: " + tokenResult.error 
      }, { status: 401 });
    }
    
    const authenticatedUserId = tokenResult.userId;
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const otherUserId = url.searchParams.get('otherUserId');
    
    // Validate that the authenticated user matches the requested userId
    if (userId && userId !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: Cannot access other user's meetings" 
      }, { status: 403 });
    }
    
    let query = {};
    if (userId && otherUserId) {
      // Fetch meetings between two specific users
      query = {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      };
    } else if (userId) {
      // Fetch all meetings for a specific user (where they are either sender or receiver)
      query = {
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      };
    } else {
      // If no userId is provided, use authenticated user ID
      query = {
        $or: [
          { senderId: authenticatedUserId },
          { receiverId: authenticatedUserId }
        ]
      };
    }
    
    const meetings = await meetingSchema.find(query);
    return NextResponse.json(meetings, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const tokenResult = validateAndExtractUserId(req as any);
    if (!tokenResult.isValid) {
      return NextResponse.json({ 
        message: "Unauthorized: " + tokenResult.error 
      }, { status: 401 });
    }
    
    const authenticatedUserId = tokenResult.userId;
    
    const body = await req.json(); // Parse the JSON body first
    
    // Validate that the authenticated user is the sender
    if (body.senderId !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: Cannot create meetings for other users" 
      }, { status: 403 });
    }
    
    // Check if users already have 2 active meetings
    const existingMeetings = await meetingSchema.find({
      $or: [
        { senderId: body.senderId, receiverId: body.receiverId },
        { senderId: body.receiverId, receiverId: body.senderId }
      ]
    });
    
    // Count active meetings (accepted with future time OR pending)
    const now = new Date();
    const activeMeetings = existingMeetings.filter(meeting => {
      const meetingTime = new Date(meeting.meetingTime);
      return (
        // Accepted meetings with future time
        (meeting.state === 'accepted' && meetingTime > now) ||
        // Pending meetings (not yet accepted/rejected)
        meeting.state === 'pending'
      );
    });
    
    console.log(`Active meetings between users: ${activeMeetings.length}`);
    
    // Prevent creating a 3rd meeting when there are already 2 active meetings
    if (activeMeetings.length >= 2) {
      return NextResponse.json({ 
        message: "You can only have a maximum of 2 active meetings (pending or scheduled) with this user at a time. Please wait for existing meetings to be completed or cancelled before scheduling new ones." 
      }, { status: 400 });
    }
    
    const meeting = new meetingSchema(body);
    const newMeeting = await meeting.save();
    
    return NextResponse.json(newMeeting, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}



/*
 ! PATCH where Daily.co room is created
*/
export async function PATCH(req: Request) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const tokenResult = validateAndExtractUserId(req as any);
    if (!tokenResult.isValid) {
      return NextResponse.json({ 
        message: "Unauthorized: " + tokenResult.error 
      }, { status: 401 });
    }
    
    const authenticatedUserId = tokenResult.userId;
    
    const meetingData = await req.json();    
    const meeting = await meetingSchema.findById(meetingData._id);

    if (!meeting) {
      console.error('Meeting not found:', meetingData._id);
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }
    
    // Validate that the authenticated user is involved in this meeting
    if (meeting.senderId.toString() !== authenticatedUserId && meeting.receiverId.toString() !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: You can only update meetings you are involved in" 
      }, { status: 403 });
    }
    
    if (meeting.state === "pending" && meetingData.acceptStatus) {
      // Only the receiver can accept a meeting
      if (meeting.receiverId.toString() !== authenticatedUserId) {
        return NextResponse.json({ 
          message: "Forbidden: Only the meeting receiver can accept the meeting" 
        }, { status: 403 });
      }
      
      const apiWorking = await testDailyAPI();
      try {
        const dailyRoomUrl = await createDailyRoom(meeting.meetingTime);

        meeting.state = "accepted";
        meeting.meetingLink = dailyRoomUrl;
        meeting.acceptStatus = true;  
      } catch (dailyError) {
        console.error('Daily.co integration failed, but continuing with meeting acceptance:', dailyError);
        
        // Still accept the meeting even if Daily.co fails
        meeting.state = "accepted";
        meeting.acceptStatus = true;
        meeting.meetingLink = `https://${DAILY_DOMAIN}/skillswap-${Date.now()}`;
        
        console.log('Meeting accepted with fallback link');
      }
    }
    // ! Handle rejection of pending meetings
    else if (meeting.state === "pending" && meetingData.state === "rejected") {
      // Only the receiver can reject a meeting
      if (meeting.receiverId.toString() !== authenticatedUserId) {
        return NextResponse.json({ 
          message: "Forbidden: Only the meeting receiver can reject the meeting" 
        }, { status: 403 });
      }
      
      meeting.state = "rejected";
      console.log('Meeting rejected');
    }
    // ! Handle other state changes
    else if (meetingData.state && meeting.state === "accepted") {
      meeting.state = meetingData.state;
      console.log('Updated meeting state to:', meetingData.state);
    }

    const updatedMeeting = await meeting.save();
    console.log('Meeting saved successfully');
    return NextResponse.json(updatedMeeting, { status: 200 });
  } catch (error: any) {
    console.error('PATCH error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}