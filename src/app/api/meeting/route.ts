import meetingSchema from "@/lib/models/meetingSchema";
import { NextResponse } from "next/server";
import fetch from "node-fetch";
import connect from "@/lib/db";
import base64 from "base-64";



// Zoom OAuth details
const zoomClientId = process.env.ZOOM_CLIENT_ID;
const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
const zoomAccountId = process.env.ZOOM_ACCOUNT_ID;

/**
 * * Get authentication headers for Zoom API
 * @returns {Object} - Authentication headers
**/
const getAuthHeaders = () => {
  return {
    Authorization: `Basic ${base64.encode(`${zoomClientId}:${zoomClientSecret}`)}`,
    "Content-Type": "application/json",
  };
};


/**
 * *Function to generate Zoom Access Token
 * @returns {string} - Zoom Access Token  @as ZoomOAuthResponse
*/
const generateZoomAccessToken = async () => {
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${zoomAccountId}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  const jsonResponse:any = await response.json() ;
  return jsonResponse.access_token;
};


/**
 * *Function to create a Zoom Meeting
 * @param {string} zoomAccessToken - Zoom Access Token
 * @returns {string} - Zoom Meeting Link
 */

const createZoomMeeting = async (zoomAccessToken: string) => {
  const response = await fetch(
    `https://api.zoom.us/v2/users/me/meetings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${zoomAccessToken}`,
      },
      body: JSON.stringify({
        topic: "Meeting Topic",
        agenda: "Meeting Agenda",
        type: 2, // Scheduled meeting
        start_time: new Date().toISOString(), // Or pass the actual meeting time
        duration: 30, // Meeting duration in minutes
        password: "12345",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waiting_room: false,
          mute_upon_entry: true,
        },
      }),
    }
  );
  const meetingData :any= await response.json() ;
  return meetingData.join_url;
};


export async function GET(req: Request) {
  await connect();
  try {
    const meetings = await meetingSchema.find();
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

export async function PATCH(req: Request) {
  await connect();
  try {
    const meetingData = await req.json();
    const meeting = await meetingSchema.findById(meetingData._id);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // Handle acceptance of pending meetings
    if (meeting.state === "pending" && meetingData.acceptStatus) {
      const zoomAccessToken = await generateZoomAccessToken();
      const zoomMeetingLink = await createZoomMeeting(zoomAccessToken);

      meeting.state = "accepted";
      meeting.meetingLink = zoomMeetingLink;
      meeting.acceptStatus = true;
      meeting.meetingTime = new Date();
    }
    // Handle other state changes
    else if (meetingData.state && meeting.state === "accepted") {
      meeting.state = meetingData.state;
    }

    const updatedMeeting = await meeting.save();
    return NextResponse.json(updatedMeeting, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

