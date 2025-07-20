import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import User from '@/lib/models/userSchema';

export async function GET(request: NextRequest) {
  try {
    await connect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).select('isBlocked firstName lastName email');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isBlocked: user.isBlocked || false,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Block status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check block status',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
} 