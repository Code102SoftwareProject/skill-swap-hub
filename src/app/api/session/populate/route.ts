import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/db';
import User from '@/lib/models/userSchema';
import UserSkill from '@/lib/models/userSkill';

// GET - Get user and skill data for populating sessions
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const userIds = searchParams.get('userIds')?.split(',') || [];
    const skillIds = searchParams.get('skillIds')?.split(',') || [];

    console.log('Populate API called with:', { userIds, skillIds });

    const users = await User.find({
      _id: { $in: userIds }
    }).select('firstName lastName email avatar');

    const skills = await UserSkill.find({
      _id: { $in: skillIds }
    }).select('skillTitle proficiencyLevel categoryName');

    return NextResponse.json({
      success: true,
      users,
      skills
    }, { status: 200 });

  } catch (error: any) {
    console.error('Populate API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
