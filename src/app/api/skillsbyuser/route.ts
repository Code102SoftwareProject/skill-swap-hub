import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import UserSkill from '@/lib/models/userSkill';

// GET - Get all skills for a specific user
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const userSkills = await UserSkill.find({ userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      skills: userSkills
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}