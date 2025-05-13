import { NextResponse } from 'next/server';
import connect from '../../../lib/db';
import Suggestion from '@/lib/models/Suggestion';
import User from '@/lib/models/userSchema';
import mongoose from 'mongoose';

// GET: Fetch all suggestions
export async function GET() {
  try {
    console.log('Attempting to connect to database...');
    await connect();
    console.log('Database connected successfully');

    // Ensure User model is registered
    if (!mongoose.models.User) {
      console.log('User model not found, registering...');
      require('@/lib/models/userSchema');
    }

    console.log('Fetching suggestions...');
    const suggestions = await Suggestion.find({}).populate({
      path: 'userId',
      select: 'firstName lastName email avatar' // Only select needed fields
    });
    console.log(`Found ${suggestions.length} suggestions`);

    // Flatten user data into each suggestion object
    const formatted = suggestions.map((s) => ({
      _id: s._id,
      category: s.category,
      date: s.date,
      title: s.title,
      description: s.description,
      status: s.status,
      // Flattened from s.userId
      userName: s.userId ? `${s.userId.firstName} ${s.userId.lastName}` : 'Unknown',
      avatar: s.userId?.avatar || '/default-avatar.png',
      role: 'User', // Default role
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Detailed error:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch suggestions', 
        details: (error as Error).message,
        type: (error as Error).name
      },
      { status: 500 }
    );
  }
}

// POST: Create new suggestion
export async function POST(request: Request) {
  try {
    await connect();
    const body = await request.json();

    const { title, description, category, userId } = body;

    if (!title || !description || !category || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const suggestion = new Suggestion(body);
    await suggestion.save();

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error('Create suggestion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create suggestion',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
