import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
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
  const { email, otp } = await req.json();

  // Validate inputs
  if (!email || !otp) {
    return NextResponse.json({ 
      success: false, 
      message: 'Email and OTP are required' 
    }, { status: 400 });
  }

  try {
    await client.connect();
    const db = client.db('skillSwapHub');
    const collection = db.collection('users');

    // Find user by email
    const user = await collection.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email or OTP' 
      }, { status: 401 });
    }

    // Check if OTP exists and is not used
    if (!user.resetOtp || user.resetOtpUsed) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      }, { status: 401 });
    }

    // Check if OTP matches
    if (user.resetOtp !== otp) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid OTP' 
      }, { status: 401 });
    }

    // Check if OTP is expired
    const now = new Date();
    if (now > new Date(user.resetOtpExpiry)) {
      return NextResponse.json({ 
        success: false, 
        message: 'OTP has expired' 
      }, { status: 401 });
    }

    // Mark OTP as used
    await collection.updateOne(
      { email },
      { $set: { resetOtpUsed: true } }
    );

    // Generate a reset token
    const resetToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' } // Token expires in 15 minutes
    );

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
  } finally {
    await client.close();
  }
}