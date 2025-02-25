import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const client = new MongoClient(process.env.MONGODB_URI);

export async function POST(req: Request) {
  const { email, password, rememberMe } = await req.json();

  // Validate inputs
  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
  }

  try {
    await client.connect();
    const db = client.db('skillSwapHub');
    const collection = db.collection('users');

    // Find user by email
    const user = await collection.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Compare provided password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      process.env.JWT_SECRET as string,
      { expiresIn: rememberMe ? '30d' : '24h' }
    );

    // Set token in cookies - await the cookies operation
    const cookieStore = cookies();
    
    // Return user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    // Create the response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      user: userWithoutPassword
    });
    
    // Set the cookie on the response object instead
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      // Set expiration based on rememberMe preference
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred during login' }, { status: 500 });
  } finally {
    await client.close();
  }
}