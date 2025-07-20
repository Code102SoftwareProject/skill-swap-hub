import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import User from '@/lib/models/userSchema';

export async function PATCH(request: Request) {
  try {
    await connect();
    const { userId, isBlocked } = await request.json();
    if (!userId || typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }
    const user = await User.findByIdAndUpdate(userId, { isBlocked }, { new: true });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user block status', details: (error as Error).message }, { status: 500 });
  }
} 