import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Suggestion from '@/lib/models/Suggestion';

export async function PATCH(request: Request) {
  try {
    await connect();
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Unhide all suggestions for the user
    const result = await Suggestion.updateMany(
      { userId, isHidden: true },
      { $set: { isHidden: false } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        message: 'No hidden suggestions found for this user',
        modifiedCount: 0 
      });
    }

    return NextResponse.json({ 
      message: `Successfully unhidden ${result.modifiedCount} suggestions`,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Unhide suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to unhide suggestions', details: (error as Error).message },
      { status: 500 }
    );
  }
} 