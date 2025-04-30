import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Suggestion from '@/lib/models/Suggestion';

export async function PUT(request: Request) {
  await connect();
  
  try {
    // Extract suggestion ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const { status } = await request.json();
    const suggestion = await Suggestion.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}