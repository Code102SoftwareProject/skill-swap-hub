import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// MongoDB Configuration
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

// JWT Configuration
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const client = new MongoClient(process.env.MONGODB_URI);

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

    // Connect to MongoDB
    await client.connect();
    const db = client.db('skillSwapHub');
    const collection = db.collection('users');

    // Find user by email from token
    const user = await collection.findOne({ email: decoded.email });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user's password
    await collection.updateOne(
      { email: decoded.email },
      { 
        $set: { 
          password: hashedPassword,
          // Clear reset fields
          resetOtp: null,
          resetOtpExpiry: null,
          resetOtpUsed: null
        } 
      }
    );

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
  } finally {
    await client.close();
  }
}