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
    
    // Hide suggestions from user view only (admin can still see them)
    const result = await Suggestion.updateMany(
      { userId }, 
      { isHidden: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      message: `Hidden ${result.modifiedCount} suggestions from user view. Admins can still see them in the moderation panel.`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to hide suggestions', details: (error as Error).message }, { status: 500 });
  }
} 