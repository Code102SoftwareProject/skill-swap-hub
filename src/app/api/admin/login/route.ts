import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '@/lib/models/adminSchema';
import connect from '@/lib/db';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!ADMIN_JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET environment variable is not defined");
}

export const POST = async (req: NextRequest) => {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password required' }, { status: 400 });
    }

    await connect();

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, email: admin.email },
      ADMIN_JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = NextResponse.json({
      message: 'Login successful',
      admin: {
        username: admin.username,
        email: admin.email
      }
    });

    // 🍪 Set token as HTTP-only cookie (optional)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1 hour
      path: '/'
    });

    return response;

  } catch (error: any) {
    return NextResponse.json({ message: 'Login error', error: error.message }, { status: 500 });
  }
};
