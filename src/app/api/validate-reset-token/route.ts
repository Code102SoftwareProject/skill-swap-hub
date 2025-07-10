import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resetToken } = body;

    if (!resetToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'Reset token is required' 
      }, { status: 400 });
    }

    // Verify the reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
    };

    // Connect to database
    await dbConnect();
    
    // Find user to ensure they still exist
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid reset token' 
      }, { status: 404 });
    }

    // Token is valid
    return NextResponse.json({ 
      success: true, 
      message: 'Reset token is valid',
      email: user.email
    });
  } catch (error) {
    console.error('Reset token validation error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Reset token has expired. Please restart the process.' 
      }, { status: 401 });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid reset token' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Token validation failed' 
    }, { status: 500 });
  }
}
