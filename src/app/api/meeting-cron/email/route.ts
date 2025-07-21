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

// Email template for meeting reminder
const createMeetingReminderEmail = (
  userFirstName: string,
  userLastName: string,
  otherUserFirstName: string,
  otherUserLastName: string,
  meetingTime: Date,
  description: string,
  meetingId: string
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

  // Always use custom meeting link format
  const meetingLinkSection = `
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
      <p style="margin: 0; font-weight: bold; color: #1976d2;">Meeting Link:</p>
      <a href="https://code102.site/meeting/${meetingId}" style="color: #007bff; text-decoration: none; font-weight: bold;">https://code102.site/meeting/${meetingId}</a>
    </div>
    `;

  return {
    subject: `🕐 Meeting Reminder: Your meeting starts soon!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">⏰ Meeting Starting Soon!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Get ready for your skill swap session</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="font-size: 18px; margin-bottom: 20px;">
            Hi <strong>${userFirstName} ${userLastName}</strong>,
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            This is a friendly reminder that your meeting with <strong>${otherUserFirstName} ${otherUserLastName}</strong> is starting soon!
          </p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2;">📅 Meeting Details</h3>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 5px 0;"><strong>With:</strong> ${otherUserFirstName} ${otherUserLastName}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>
          </div>
          
          ${meetingLinkSection}
          
          <div style="background-color: #f1f8e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h4 style="margin: 0 0 10px 0; color: #388e3c;">💡 Quick Tips for a Great Meeting:</h4>
            <ul style="margin: 5px 0; padding-left: 20px; color: #2e7d32;">
              <li>Test your camera and microphone beforehand</li>
              <li>Find a quiet, well-lit space</li>
              <li>Have your materials ready</li>
              <li>Be punctual and respectful of each other's time</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              This is an automated reminder from SkillSwap Hub.<br>
              We hope you have a productive and enjoyable meeting! 🚀
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
Meeting Reminder - Starting Soon!

Hi ${userFirstName} ${userLastName},

Your meeting with ${otherUserFirstName} ${otherUserLastName} is starting soon!

Meeting Details:
- Time: ${formattedTime}
- With: ${otherUserFirstName} ${otherUserLastName}
- Description: ${description}

${`Meeting Link: https://code102.site/meeting/${meetingId}`}

Quick Tips for a Great Meeting:
• Test your camera and microphone beforehand
• Find a quiet, well-lit space
• Have your materials ready
• Be punctual and respectful of each other's time

This is an automated reminder from SkillSwap Hub.
We hope you have a productive and enjoyable meeting!

© 2024 SkillSwap Hub. All rights reserved.
    `.trim()
  };
};

// Main function to send meeting reminders
async function sendMeetingReminders() {
  try {
    console.log('🔍 Starting meeting reminder check...');
    
    // Calculate time window: current time to current time + 10 minutes
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    
    console.log('⏰ Time window:', {
      now: now.toISOString(),
      tenMinutesFromNow: tenMinutesFromNow.toISOString()
    });

    // First, let's check all accepted meetings to debug
    const allAcceptedMeetings = await Meeting.find({
      state: 'accepted'
    }).populate('senderId receiverId');
    
    console.log(`📊 Debug: Total accepted meetings found: ${allAcceptedMeetings.length}`);
    
    // Log details of each accepted meeting for debugging
    allAcceptedMeetings.forEach((meeting, index) => {
      const meetingTime = new Date(meeting.meetingTime);
      const timeDiff = meetingTime.getTime() - now.getTime();
      const minutesDiff = Math.round(timeDiff / (1000 * 60));
      
      console.log(`📋 Meeting ${index + 1}:`, {
        id: meeting._id,
        meetingTime: meetingTime.toISOString(),
        timeDifferenceMinutes: minutesDiff,
        isInWindow: minutesDiff >= 0 && minutesDiff <= 10
      });
    });

    // Find accepted meetings within the next 10 minutes (including meetings starting now or in the past but not more than 10 minutes ago)
    const upcomingMeetings = await Meeting.find({
      state: 'accepted',
      meetingTime: {
        $gte: now,           // Meeting time is now or in the future
        $lte: tenMinutesFromNow  // Meeting time is within the next 10 minutes
      }
    }).populate('senderId receiverId');

    console.log(`📅 Found ${upcomingMeetings.length} meetings starting within next 10 minutes`);

    if (upcomingMeetings.length === 0) {
      return {
        success: true,
        message: 'No meetings found within the next 10 minutes',
        processed: 0,
        debug: {
          totalAcceptedMeetings: allAcceptedMeetings.length,
          timeWindow: {
            now: now.toISOString(),
            tenMinutesFromNow: tenMinutesFromNow.toISOString()
          }
        }
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

    // Process each meeting
    for (const meeting of upcomingMeetings) {
      try {
        console.log(`📧 Processing meeting ${meeting._id}`);
        
        // Check if notifications have already been sent for this meeting
        const existingNotification = await MeetingEmailNotification.getNotificationStatus(meeting._id);
        
        if (existingNotification) {
          console.log(`⏭️ Meeting ${meeting._id} notification status:`, {
            senderNotified: existingNotification.senderNotified,
            receiverNotified: existingNotification.receiverNotified,
            notificationSentAt: existingNotification.notificationSentAt
          });
          
          // If both users have already been notified, skip this meeting
          if (existingNotification.senderNotified && existingNotification.receiverNotified) {
            console.log(`⏭️ Skipping meeting ${meeting._id} - both users already notified`);
            skippedMeetings++;
            continue;
          }
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

        // Check if we need to send email to sender
        if (!existingNotification?.senderNotified) {
          // Create email content for sender
          const senderEmail = createMeetingReminderEmail(
            sender.firstName,
            sender.lastName,
            receiver.firstName,
            receiver.lastName,
            meeting.meetingTime,
            meeting.description,
            meeting._id.toString()
          );

          // Send email to sender
          try {
            await transporter.sendMail({
              from: `"SkillSwap Hub" <${process.env.MEETING_NOTI_MAIL}>`,
              to: sender.email,
              subject: senderEmail.subject,
              html: senderEmail.html,
              text: senderEmail.text
            });
            console.log(`✅ Email sent to sender: ${sender.email}`);
            emailsSent++;
            
            // Mark sender as notified
            await MeetingEmailNotification.markUserNotified(meeting._id, 'sender');
            console.log(`✅ Marked sender as notified for meeting ${meeting._id}`);
            
          } catch (emailError: any) {
            console.error(`❌ Failed to send email to sender ${sender.email}:`, emailError);
            errors.push(`Failed to send email to sender ${sender.email}: ${emailError?.message || 'Unknown error'}`);
          }
        } else {
          console.log(`⏭️ Sender already notified for meeting ${meeting._id}`);
        }

        // Check if we need to send email to receiver
        if (!existingNotification?.receiverNotified) {
          // Create email content for receiver
          const receiverEmail = createMeetingReminderEmail(
            receiver.firstName,
            receiver.lastName,
            sender.firstName,
            sender.lastName,
            meeting.meetingTime,
            meeting.description,
            meeting._id.toString()
          );

          // Send email to receiver
          try {
            await transporter.sendMail({
              from: `"SkillSwap Hub" <${process.env.MEETING_NOTI_MAIL}>`,
              to: receiver.email,
              subject: receiverEmail.subject,
              html: receiverEmail.html,
              text: receiverEmail.text
            });
            console.log(`✅ Email sent to receiver: ${receiver.email}`);
            emailsSent++;
            
            // Mark receiver as notified
            await MeetingEmailNotification.markUserNotified(meeting._id, 'receiver');
            console.log(`✅ Marked receiver as notified for meeting ${meeting._id}`);
            
          } catch (emailError: any) {
            console.error(`❌ Failed to send email to receiver ${receiver.email}:`, emailError);
            errors.push(`Failed to send email to receiver ${receiver.email}: ${emailError?.message || 'Unknown error'}`);
          }
        } else {
          console.log(`⏭️ Receiver already notified for meeting ${meeting._id}`);
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (meetingError: any) {
        console.error(`❌ Error processing meeting ${meeting._id}:`, meetingError);
        errors.push(`Error processing meeting ${meeting._id}: ${meetingError?.message || 'Unknown error'}`);
      }
    }

    console.log(`🎉 Meeting reminder job completed. Emails sent: ${emailsSent}, Meetings skipped: ${skippedMeetings}`);

    return {
      success: true,
      message: `Meeting reminders processed successfully`,
      processed: upcomingMeetings.length,
      emailsSent,
      skippedMeetings,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('❌ Error in sendMeetingReminders:', error);
    throw error;
  }
}

// GET endpoint for cron job
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Meeting cron job started at:', new Date().toISOString());
    
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

    // Send meeting reminders
    const result = await sendMeetingReminders();
    
    console.log('✅ Meeting cron job completed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Meeting reminders cron job executed successfully',
      timestamp: new Date().toISOString(),
      result
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Meeting cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Meeting reminders cron job failed',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Optional: Add a health check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
