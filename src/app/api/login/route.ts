import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export async function POST(req: Request) {
  const { email, password, rememberMe } = await req.json();

  // Validate inputs
  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
  }

  try {
    // Connect to database
    await dbConnect();
    
    // Find user by email
    console.log(`Looking for user with email: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    console.log('User found, verifying password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // 🔥 TESTING: Generate JWT token with 10 second expiry for normal login
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      process.env.JWT_SECRET as string,
      { expiresIn: rememberMe ? '30d' : '10s' }  // 🚨 10 SECONDS FOR TESTING
    );

    // Optional: Log for debugging
    console.log('🧪 TEST TOKEN: Normal login expires in 10 seconds, Remember Me in 30 days');
    console.log('🕐 Current time:', new Date().toLocaleTimeString());
    console.log('⏰ Token will expire at:', new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 10000)).toLocaleTimeString());

    // Return success response with token and user info
    return NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      token,
      user: user
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred during login' }, { status: 500 });
  }
}