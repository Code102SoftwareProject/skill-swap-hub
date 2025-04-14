import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '@/lib/models/adminSchema';
import dbConnect from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  await dbConnect();

  // 🔍 Find admin by username
  const admin = await Admin.findOne({ username });

  if (!admin) {
    return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
  }

  // 🔐 Compare hashed password
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return NextResponse.json({ message: 'Incorrect password' }, { status: 401 });
  }

  // 🪪 Generate JWT
  const token = jwt.sign({ id: admin._id, username: admin.username, role: admin.role }, JWT_SECRET, {
    expiresIn: '1h',
  });

  // 🍪 Set token in secure cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
    path: '/',
  });

  return response;
}
