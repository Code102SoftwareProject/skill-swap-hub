import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import connect from '../../../lib/db';
import Suggestion from '@/lib/modals/Suggestion';

export async function GET() {
  try {
    await connect();
    const suggestions = await Suggestion.find({});
    return NextResponse.json(suggestions);
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