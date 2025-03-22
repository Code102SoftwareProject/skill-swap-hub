import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Configure SendGrid
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not defined');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// MongoDB Configuration
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

const client = new MongoClient(process.env.MONGODB_URI);

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Calculate expiry time (5 minutes from now)
function calculateExpiryTime() {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
}

export async function POST(req: Request) {
  const { email } = await req.json();

  // Validate inputs
  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
  }

  try {
    await client.connect();
    const db = client.db('skillSwapHub');
    const collection = db.collection('users');

    // Find user by email
    const user = await collection.findOne({ email });
    if (!user) {
      // For security reasons, we still return success even if the email doesn't exist
      // This prevents email enumeration attacks
      return NextResponse.json({ success: true, message: 'If your email is registered, you will receive a reset code shortly' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = calculateExpiryTime();

    // Store OTP in user record
    await collection.updateOne(
      { email },
      { 
        $set: { 
          resetOtp: otp, 
          resetOtpExpiry: otpExpiry,
          resetOtpUsed: false
        } 
      }
    );

    // Send email with OTP
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@skillswaphub.com', // Use your verified sender
      subject: 'SkillSwap Hub Password Reset',
      text: `Your password reset code is: ${otp}. This code will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6;">SkillSwap Hub Password Reset</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your SkillSwap Hub account.</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this reset, please ignore this email or contact support if you have concerns.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      message: 'If your email is registered, you will receive a reset code shortly' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while processing your request' 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}