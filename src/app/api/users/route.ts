import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import User from '@/lib/modals/userSchema';

export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const { _id, name, email, avatar } = body;

    if (!_id || !name || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await User.create({ _id, name, email, avatar });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
