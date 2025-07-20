import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import User from '@/lib/models/userSchema';
import { Types } from 'mongoose';

// GET - Get user by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  await connect();
  
  try {
    const { userId } = await params;

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        title: user.title,
        avatar: user.avatar,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt
      },
      isBlocked: user.isBlocked
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
