import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';
import OtpVerification from '@/lib/models/otpVerificationSchema';

// JWT Configuration
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export async function POST(req: Request) {
  const { resetToken, password } = await req.json();

  // Validate inputs
  if (!resetToken || !password) {
    return NextResponse.json({ 
      success: false, 
      message: 'Reset token and new password are required' 
    }, { status: 400 });
  }

  try {
    // Verify the reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
    };

    // Connect to database
    await dbConnect();
    
    // Find user by email from token
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    // Update user's password - let the schema handle hashing
    user.password = password;
    await user.save();
    console.log('User password updated in database');
    
    // Clean up by deleting all OTP verification records for this user
    await OtpVerification.deleteMany({ userId: user._id });

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    
    // Check if it's a token verification error
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while resetting password' 
    }, { status: 500 });
  }
}