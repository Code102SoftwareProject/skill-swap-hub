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

    // Add select to only fetch necessary fields for better performance
    const userSkills = await UserSkill.find({ userId })
      .select('skillTitle proficiencyLevel description categoryName isVerified userId createdAt')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance when we don't need mongoose document methods

    return NextResponse.json({
      success: true,
      skills: userSkills
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' // Cache for 1 minute
      }
    });

  } catch (error: any) {
    console.error('Error fetching user skills:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}