import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

export async function POST(req: Request) {
  const { firstName, lastName, email, phone, title, password } = await req.json();

  // Validate inputs
  if (!firstName || !lastName || !email || !phone || !title || !password) {
    return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
  }

  // Validate password strength
  if (password.length < 8) {
    return NextResponse.json({ 
      success: false, 
      message: 'Password must be at least 8 characters long' 
    }, { status: 400 });
  }

  try {
    // Connect to database
    await dbConnect();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    }

    // Create new user (password is automatically hashed in pre-save hook)
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      title,
      password
    });

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 });
  }
}