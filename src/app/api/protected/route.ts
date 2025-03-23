import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

// Helper function to verify JWT and extract user info
const getUserFromToken = (request: NextRequest) => {
  // Extract token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
      name: string;
    };
    
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  // Verify user is authenticated
  const tokenPayload = getUserFromToken(request);
  
  if (!tokenPayload) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Connect to database
    await dbConnect();
    
    // Get user profile data
    const user = await User.findById(tokenPayload.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data (password is automatically excluded by toJSON method)
    return NextResponse.json({
      success: true,
      data: {
        profile: user,
        // Additional user data can be added here
      }
    });
  } catch (error) {
    console.error('Protected API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Example of updating user profile
export async function PUT(request: NextRequest) {
  // Verify user is authenticated
  const tokenPayload = getUserFromToken(request);
  
  if (!tokenPayload) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const requestData = await request.json();
    
    // Validate the request data
    if (!requestData) {
      return NextResponse.json(
        { success: false, message: 'No data provided' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Prevent updating sensitive fields
    const { password, email, _id, ...updateData } = requestData;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      tokenPayload.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser // Password will be excluded by toJSON method
    });
  } catch (error) {
    console.error('Protected API update error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}