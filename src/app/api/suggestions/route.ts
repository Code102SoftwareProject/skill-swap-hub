import { NextResponse } from 'next/server';
import connect from '../../../lib/db';
import Suggestion from '@/lib/models/Suggestion';
import User from '@/lib/models/userSchema';
import mongoose from 'mongoose';

// GET: Fetch all suggestions
export async function GET(request: Request) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const suggestions = await Suggestion.find(filter).populate({
      path: 'userId',
      select: 'firstName lastName email avatar'
    });

    const formatted = suggestions.map((s) => ({
      _id: s._id,
      category: s.category,
      date: s.date,
      title: s.title,
      description: s.description,
      status: s.status,
      userName: s.userId ? `${s.userId.firstName} ${s.userId.lastName}` : 'Unknown',
      avatar: s.userId?.avatar || '/default-avatar.png',
      role: 'User',
    }));

    return NextResponse.json(formatted);
  } catch (error) {
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
