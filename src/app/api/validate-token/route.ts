import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';

// JWT Configuration
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export async function POST(req: Request) {
  const { resetToken } = await req.json();

  // Validate input
  if (!resetToken) {
    return NextResponse.json({ 
      success: false, 
      message: 'Reset token is required' 
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

    // If we got here, the token is valid
    return NextResponse.json({ 
      success: true, 
      message: 'Token is valid',
      email: decoded.email
    });
  } catch (error) {
    console.error('Validate token error:', error);
    
    // Check if it's a token verification error
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while validating token' 
    }, { status: 500 });
  }
}