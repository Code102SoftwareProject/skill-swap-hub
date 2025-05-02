import { NextResponse } from 'next/server';
import connect from '../../../lib/db';
import Suggestion from '@/lib/models/Suggestion';

// GET: Fetch all suggestions
export async function GET() {
  try {
    await connect();
    const suggestions = await Suggestion.find({}).populate('userId');

    // Flatten user data into each suggestion object
    const formatted = suggestions.map((s) => ({
      _id: s._id,
      category: s.category,
      date: s.date,
      title: s.title,
      description: s.description,
      status: s.status,
      // Flattened from s.userId
      userName: s.userId?.userName || 'Unknown',
      avatar: s.userId?.avatar || '/default-avatar.png',
      role: s.userId?.role || 'User',
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', details: (error as Error).message },
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
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}
