import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs'; // Import bcryptjs instead of bcrypt

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

const client = new MongoClient(process.env.MONGODB_URI);

export async function POST(req: Request) {
  const { firstName, lastName, email, phone, title, password } = await req.json();

  // Validate inputs
  if (!firstName || !lastName || !email || !phone || !title || !password) {
    return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
  }

  try {
    await client.connect();
    const db = client.db('skillSwapHub');
    const collection = db.collection('users');

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    }

    // Hash the password with bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user with hashed password into the database
    const newUser = { firstName, lastName, email, phone, title, password: hashedPassword };
    await collection.insertOne(newUser);

    return NextResponse.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 });
  } finally {
    await client.close();
  }
}
