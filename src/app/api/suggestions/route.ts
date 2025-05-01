import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import connect from '../../../lib/db';
import Suggestion from '@/lib/models/Suggestion';

// Handle GET requests (fetch all suggestions)
export async function GET() {
  try {
    await connect();
    const suggestions = await Suggestion.find({})
      .populate('userId', 'firstName lastName title avatar'); // get only needed fields

    // Format the data to match your frontend interface
    const formattedSuggestions = suggestions.map((sugg: any) => ({
      _id: sugg._id,
      userName: `${sugg.userId.firstName} ${sugg.userId.lastName}`,
      role: sugg.userId.title,
      avatar: sugg.userId.avatar,
      category: sugg.category,
      date: sugg.date,
      title: sugg.title,
      status: sugg.status,
      description: sugg.description,
    }));

    return NextResponse.json(formattedSuggestions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}


// Handle POST requests (create new suggestion)
export async function POST(request: Request) {
  try {
    await connect();
    const body = await request.json();
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