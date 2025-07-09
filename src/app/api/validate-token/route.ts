import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export async function POST(req: Request) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: 'No token provided' 
      }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
    };

    // Connect to database
    await dbConnect();
    
    // Find user to ensure they still exist and aren't suspended
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    // Check if user is suspended
    if (user.suspension?.isSuspended) {
      return NextResponse.json({ 
        success: false, 
        message: 'Account suspended' 
      }, { status: 403 });
    }

    // Token is valid
    return NextResponse.json({ 
      success: true, 
      message: 'Token is valid',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        title: user.title
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Token expired' 
      }, { status: 401 });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Token validation failed' 
    }, { status: 500 });
  }
}