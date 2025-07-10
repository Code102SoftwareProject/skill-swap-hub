import meetingSchema from "@/lib/models/meetingSchema";
import { NextResponse } from "next/server";
import connect from "@/lib/db";

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
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const otherUserId = url.searchParams.get('otherUserId');
    
    let query = {};
    if (userId && otherUserId) {
      query = {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
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
    const body = await req.json(); // Parse the JSON body first
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
    const meetingData = await req.json();
    console.log('PATCH request received:', meetingData);
    
    const meeting = await meetingSchema.findById(meetingData._id);

    if (!meeting) {
      console.error('Meeting not found:', meetingData._id);
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    console.log('Found meeting:', meeting.state, meeting.acceptStatus);

    // ! Handle acceptance of pending meetings
    if (meeting.state === "pending" && meetingData.acceptStatus) {
      console.log('Accepting meeting and creating Daily.co room...');
      
      // First test the API connectivity
      const apiWorking = await testDailyAPI();
      
      try {
        const dailyRoomUrl = await createDailyRoom(meeting.meetingTime);

        meeting.state = "accepted";
        meeting.meetingLink = dailyRoomUrl;
        meeting.acceptStatus = true;
        
        console.log('Meeting accepted with Daily.co room:', dailyRoomUrl);
      } catch (dailyError) {
        console.error('Daily.co integration failed, but continuing with meeting acceptance:', dailyError);
        
        // Still accept the meeting even if Daily.co fails
        meeting.state = "accepted";
        meeting.acceptStatus = true;
        meeting.meetingLink = `https://${DAILY_DOMAIN}/skillswap-${Date.now()}`;
        
        console.log('Meeting accepted with fallback link');
      }
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