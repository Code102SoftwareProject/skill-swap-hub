import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Suggestion from '@/lib/modals/Suggestion';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  
  try {
    const { status } = await request.json();
    const suggestion = await Suggestion.findByIdAndUpdate(
      params.id,
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