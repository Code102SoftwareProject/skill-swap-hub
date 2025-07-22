import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Meeting from '@/lib/models/meetingSchema';
import User from '@/lib/models/userSchema';
import MeetingEmailNotification from '@/lib/models/meetingEmailNotificationSchema';
import connect from '@/lib/db';

// Create nodemailer transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MEETING_NOTI_MAIL,
      pass: process.env.MEETING_NOTI_PW,
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
  });
};

// Email template for meeting cancellation
const createMeetingCancellationEmail = (
  userFirstName: string,
  userLastName: string,
  otherUserFirstName: string,
  otherUserLastName: string,
  meetingTime: Date,
  description: string,
  meetingId: string,
  isCancelledBy: boolean // true if this user cancelled, false if other user cancelled
) => {
  const formattedTime = meetingTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const cancellationMessage = isCancelledBy 
    ? `You have successfully cancelled your meeting with <strong>${otherUserFirstName} ${otherUserLastName}</strong>.`
    : `<strong>${otherUserFirstName} ${otherUserLastName}</strong> has cancelled your scheduled meeting.`;

  const subject = isCancelledBy 
    ? `✅ Meeting Cancelled: Confirmation of your cancellation`
    : `❌ Meeting Cancelled: Your meeting has been cancelled`;

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">❌ Meeting Cancelled</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your skill swap session has been cancelled</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="font-size: 18px; margin-bottom: 20px;">
            Hi <strong>${userFirstName} ${userLastName}</strong>,
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            ${cancellationMessage}
          </p>
          
          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
            <h3 style="margin: 0 0 10px 0; color: #d32f2f;">📅 Cancelled Meeting Details</h3>
            <p style="margin: 5px 0;"><strong>Originally Scheduled:</strong> ${formattedTime}</p>
            <p style="margin: 5px 0;"><strong>With:</strong> ${otherUserFirstName} ${otherUserLastName}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>
            <p style="margin: 5px 0;"><strong>Meeting ID:</strong> ${meetingId}</p>
          </div>
          
          ${!isCancelledBy ? `
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h4 style="margin: 0 0 10px 0; color: #388e3c;">💡 What's Next?</h4>
            <ul style="margin: 5px 0; padding-left: 20px; color: #2e7d32;">
              <li>You can browse and connect with other users on SkillSwap Hub</li>
              <li>Consider reaching out to reschedule if the timing didn't work</li>
              <li>Look for other skill swap opportunities that match your interests</li>
              <li>Update your availability if your schedule has changed</li>
            </ul>
          </div>
          ` : `
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h4 style="margin: 0 0 10px 0; color: #388e3c;">💡 Cancellation Confirmed</h4>
            <p style="margin: 5px 0; color: #2e7d32;">
              Your meeting has been successfully cancelled. Both you and ${otherUserFirstName} ${otherUserLastName} have been notified.
              You can always schedule new meetings with other users on SkillSwap Hub.
            </p>
          </div>
          `}
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              This is an automated notification from SkillSwap Hub.<br>
              We're sorry this meeting didn't work out, but there are always more opportunities! 🌟
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;">
          <p style="margin: 0;">
            © 2024 SkillSwap Hub. All rights reserved.<br>
            If you have any questions, please contact our support team.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Meeting Cancelled

Hi ${userFirstName} ${userLastName},

${isCancelledBy 
  ? `You have successfully cancelled your meeting with ${otherUserFirstName} ${otherUserLastName}.`
  : `${otherUserFirstName} ${otherUserLastName} has cancelled your scheduled meeting.`
}

Cancelled Meeting Details:
- Originally Scheduled: ${formattedTime}
- With: ${otherUserFirstName} ${otherUserLastName}
- Description: ${description}
- Meeting ID: ${meetingId}

${!isCancelledBy 
  ? `What's Next?
• You can browse and connect with other users on SkillSwap Hub
• Consider reaching out to reschedule if the timing didn't work
• Look for other skill swap opportunities that match your interests
• Update your availability if your schedule has changed`
  : `Cancellation Confirmed
Your meeting has been successfully cancelled. Both you and ${otherUserFirstName} ${otherUserLastName} have been notified.
You can always schedule new meetings with other users on SkillSwap Hub.`
}

This is an automated notification from SkillSwap Hub.
We're sorry this meeting didn't work out, but there are always more opportunities!

© 2024 SkillSwap Hub. All rights reserved.
    `.trim()
  };
};

// Main function to send cancellation emails for cancelled meetings
async function sendCancellationEmails() {
  try {
    console.log('🔍 Starting cancellation email check...');
    
    const now = new Date();
    
    console.log('⏰ Current time:', now.toISOString());

    // Find cancelled meetings that are scheduled in the future and haven't been processed yet
    const cancelledMeetings = await Meeting.find({
      state: 'cancelled',
      meetingTime: {
        $gt: now  // Meeting time is in the future
      }
    }).populate('senderId receiverId');

    console.log(`📅 Found ${cancelledMeetings.length} cancelled meetings scheduled for the future`);

    if (cancelledMeetings.length === 0) {
      return {
        success: true,
        message: 'No cancelled meetings found that are scheduled for the future',
        processed: 0
      };
    }

    // Create transporter
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('✅ Email transporter verified');

    let emailsSent = 0;
    let errors = [];
    let skippedMeetings = 0;

    // Process each cancelled meeting
    for (const meeting of cancelledMeetings) {
      try {
        console.log(`📧 Processing cancelled meeting ${meeting._id}`);
        
        // Check if cancellation notifications have already been sent for this meeting
        const existingNotification = await MeetingEmailNotification.getNotificationStatus(meeting._id);
        
        if (existingNotification && existingNotification.senderNotified && existingNotification.receiverNotified) {
          console.log(`⏭️ Skipping meeting ${meeting._id} - cancellation emails already sent`);
          skippedMeetings++;
          continue;
        }
        
        // Get populated user data
        const sender = meeting.senderId as any;
        const receiver = meeting.receiverId as any;

        if (!sender || !receiver) {
          console.error(`❌ Missing user data for meeting ${meeting._id}`);
          errors.push(`Missing user data for meeting ${meeting._id}`);
          continue;
        }

        console.log('👥 Meeting participants:', {
          sender: `${sender.firstName} ${sender.lastName} (${sender.email})`,
          receiver: `${receiver.firstName} ${receiver.lastName} (${receiver.email})`
        });

        // Send cancellation email to sender
        if (!existingNotification?.senderNotified) {
          const senderEmail = createMeetingCancellationEmail(
            sender.firstName,
            sender.lastName,
            receiver.firstName,
            receiver.lastName,
            meeting.meetingTime,
            meeting.description,
            meeting._id.toString(),
            true // Assuming sender cancelled (you might want to track who cancelled)
          );

          try {
            await transporter.sendMail({
              from: `"SkillSwap Hub" <${process.env.MEETING_NOTI_MAIL}>`,
              to: sender.email,
              subject: senderEmail.subject,
              html: senderEmail.html,
              text: senderEmail.text
            });
            console.log(`✅ Cancellation email sent to sender: ${sender.email}`);
            emailsSent++;
            
            // Mark sender as notified
            await MeetingEmailNotification.markUserNotified(meeting._id, 'sender');
            console.log(`✅ Marked sender as notified for cancelled meeting ${meeting._id}`);
            
          } catch (emailError: any) {
            console.error(`❌ Failed to send cancellation email to sender ${sender.email}:`, emailError);
            errors.push(`Failed to send email to sender ${sender.email}: ${emailError?.message || 'Unknown error'}`);
          }
        }

        // Send cancellation email to receiver
        if (!existingNotification?.receiverNotified) {
          const receiverEmail = createMeetingCancellationEmail(
            receiver.firstName,
            receiver.lastName,
            sender.firstName,
            sender.lastName,
            meeting.meetingTime,
            meeting.description,
            meeting._id.toString(),
            false // Receiver didn't cancel
          );

          try {
            await transporter.sendMail({
              from: `"SkillSwap Hub" <${process.env.MEETING_NOTI_MAIL}>`,
              to: receiver.email,
              subject: receiverEmail.subject,
              html: receiverEmail.html,
              text: receiverEmail.text
            });
            console.log(`✅ Cancellation email sent to receiver: ${receiver.email}`);
            emailsSent++;
            
            // Mark receiver as notified
            await MeetingEmailNotification.markUserNotified(meeting._id, 'receiver');
            console.log(`✅ Marked receiver as notified for cancelled meeting ${meeting._id}`);
            
          } catch (emailError: any) {
            console.error(`❌ Failed to send cancellation email to receiver ${receiver.email}:`, emailError);
            errors.push(`Failed to send email to receiver ${receiver.email}: ${emailError?.message || 'Unknown error'}`);
          }
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (meetingError: any) {
        console.error(`❌ Error processing cancelled meeting ${meeting._id}:`, meetingError);
        errors.push(`Error processing meeting ${meeting._id}: ${meetingError?.message || 'Unknown error'}`);
      }
    }

    console.log(`🎉 Cancellation email job completed. Emails sent: ${emailsSent}, Meetings skipped: ${skippedMeetings}`);

    return {
      success: true,
      message: `Cancellation emails processed successfully`,
      processed: cancelledMeetings.length,
      emailsSent,
      skippedMeetings,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('❌ Error in sendCancellationEmails:', error);
    throw error;
  }
}

// GET endpoint for cron job
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Meeting cancellation cron job started at:', new Date().toISOString());
    
    // Validate System API Key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.SYSTEM_API_KEY) {
      console.error('❌ Unauthorized: Invalid or missing API key');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized: Invalid or missing API key',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }
    
    // Connect to database
    await connect();
    
    // Verify required environment variables
    if (!process.env.MEETING_NOTI_MAIL || !process.env.MEETING_NOTI_PW) {
      throw new Error('Missing required email configuration environment variables');
    }

    // Send cancellation emails
    const result = await sendCancellationEmails();
    
    console.log('✅ Meeting cancellation cron job completed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Meeting cancellation emails cron job executed successfully',
      timestamp: new Date().toISOString(),
      result
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Meeting cancellation cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Meeting cancellation emails cron job failed',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Optional: Add a health check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

// POST endpoint for immediate cancellation email sending (when a meeting is cancelled)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Immediate meeting cancellation email triggered at:', new Date().toISOString());
    
    // Validate System API Key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.SYSTEM_API_KEY) {
      console.error('❌ Unauthorized: Invalid or missing API key');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized: Invalid or missing API key',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Get meeting ID from request body
    const body = await request.json();
    const { meetingId, cancelledBy } = body;

    if (!meetingId) {
      return NextResponse.json({
        success: false,
        message: 'Meeting ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Connect to database
    await connect();
    
    // Verify required environment variables
    if (!process.env.MEETING_NOTI_MAIL || !process.env.MEETING_NOTI_PW) {
      throw new Error('Missing required email configuration environment variables');
    }

    // Find the specific cancelled meeting
    const meeting = await Meeting.findById(meetingId).populate('senderId receiverId');

    if (!meeting) {
      return NextResponse.json({
        success: false,
        message: 'Meeting not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    if (meeting.state !== 'cancelled') {
      return NextResponse.json({
        success: false,
        message: 'Meeting is not in cancelled state',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const now = new Date();
    if (meeting.meetingTime <= now) {
      return NextResponse.json({
        success: false,
        message: 'Meeting is not scheduled for the future',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Check if emails have already been sent
    const existingNotification = await MeetingEmailNotification.getNotificationStatus(meeting._id);
    if (existingNotification && existingNotification.senderNotified && existingNotification.receiverNotified) {
      return NextResponse.json({
        success: false,
        message: 'Cancellation emails have already been sent for this meeting',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Create transporter
    const transporter = createTransporter();
    await transporter.verify();

    const sender = meeting.senderId as any;
    const receiver = meeting.receiverId as any;

    let emailsSent = 0;
    const errors = [];

    // Determine who cancelled the meeting
    const senderCancelled = cancelledBy === 'sender' || cancelledBy === sender._id.toString();

    // Send email to sender
    const senderEmail = createMeetingCancellationEmail(
      sender.firstName,
      sender.lastName,
      receiver.firstName,
      receiver.lastName,
      meeting.meetingTime,
      meeting.description,
      meeting._id.toString(),
      senderCancelled
    );

    try {
      await transporter.sendMail({
        from: `"SkillSwap Hub" <${process.env.MEETING_NOTI_MAIL}>`,
        to: sender.email,
        subject: senderEmail.subject,
        html: senderEmail.html,
        text: senderEmail.text
      });
      emailsSent++;
      await MeetingEmailNotification.markUserNotified(meeting._id, 'sender');
    } catch (emailError: any) {
      errors.push(`Failed to send email to sender: ${emailError?.message}`);
    }

    // Send email to receiver
    const receiverEmail = createMeetingCancellationEmail(
      receiver.firstName,
      receiver.lastName,
      sender.firstName,
      sender.lastName,
      meeting.meetingTime,
      meeting.description,
      meeting._id.toString(),
      !senderCancelled
    );

    try {
      await transporter.sendMail({
        from: `"SkillSwap Hub" <${process.env.MEETING_NOTI_MAIL}>`,
        to: receiver.email,
        subject: receiverEmail.subject,
        html: receiverEmail.html,
        text: receiverEmail.text
      });
      emailsSent++;
      await MeetingEmailNotification.markUserNotified(meeting._id, 'receiver');
    } catch (emailError: any) {
      errors.push(`Failed to send email to receiver: ${emailError?.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Meeting cancellation emails sent successfully',
      timestamp: new Date().toISOString(),
      result: {
        meetingId,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Immediate meeting cancellation email failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Meeting cancellation email failed',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
