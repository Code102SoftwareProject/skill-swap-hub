import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export async function POST(req: NextRequest) {
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

    const { phone, title } = await req.json();

    // Validate required fields
    if (!phone || !title) {
      return NextResponse.json({ 
        success: false, 
        message: 'Phone number and professional title are required' 
      }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Find and update user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    // Update user profile
    user.phone = phone;
    user.title = title;
    user.profileCompleted = true;
    await user.save();

    // Generate new JWT token with updated user info
    const newToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Profile completed successfully',
      token: newToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        title: user.title,
        avatar: user.avatar,
        isGoogleUser: user.isGoogleUser,
        profileCompleted: user.profileCompleted
      }
    });

  } catch (error: any) {
    console.error('Profile completion error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Profile completion failed' 
    }, { status: 500 });
  }
}
