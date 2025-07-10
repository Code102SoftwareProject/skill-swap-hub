import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';
import OtpVerification from '@/lib/models/otpVerificationSchema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    console.log("Received verify OTP request:", { email, otp });
    
    // Validate inputs
    if (!email || !otp) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email and OTP are required' 
      }, { status: 400 });
    }

    // Connect to database
    await dbConnect();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for email:', email);
      // For security reasons, provide a generic error message
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email or OTP' 
      }, { status: 401 });
    }

    console.log('User found, searching for OTP record');

    // Find OTP verification record
    const otpRecord = await OtpVerification.findOne({
      userId: user._id,
      otp: otp,
      used: false
    });
    
    // Check if OTP exists
    if (!otpRecord) {
      console.log('OTP record not found or already used');
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      }, { status: 401 });
    }

    // Check if OTP is expired
    const now = new Date();
    console.log('Current time:', now);
    console.log('OTP expires at:', otpRecord.expiresAt);
    
    if (now > new Date(otpRecord.expiresAt)) {
      console.log('OTP has expired');
      return NextResponse.json({ 
        success: false, 
        message: 'OTP has expired' 
      }, { status: 401 });
    }

    console.log('OTP is valid, marking as used');

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Generate a reset token
    const resetToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' } // Token expires in 15 minutes
    );

    console.log("OTP verification successful for:", email);
    console.log("Generated reset token with 15m expiry");

    return NextResponse.json({ 
      success: true, 
      message: 'OTP verified successfully',
      resetToken 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while verifying OTP' 
      }, { status: 500 });
  }
}