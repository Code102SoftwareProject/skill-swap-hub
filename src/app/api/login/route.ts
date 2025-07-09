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

  // In your login route.ts

try {
  // Connect to database
  await dbConnect();
  
  // Find user by email - add some logging
  console.log(`Looking for user with email: ${email}`);
  const user = await User.findOne({ email });
  
  if (!user) {
    console.log('User not found');
    return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
  }

  // Verify password - add more logging
  console.log('User found, verifying password...');
  const isPasswordValid = await user.comparePassword(password);
  console.log(`Password valid: ${isPasswordValid}`);
  
  if (!isPasswordValid) {
    return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
  }

  // Rest of your login code...
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      process.env.JWT_SECRET as string,
      { expiresIn: rememberMe ? '30d' : '10s' }
    );

    // Return success response with token and user info (password is automatically excluded by toJSON method)
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