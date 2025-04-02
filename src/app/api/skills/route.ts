// File: src/app/api/skills/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillList from '@/lib/models/skillList';

// GET - Fetch all skill categories and their skills
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Fetch all skill categories with their skills
    const skillLists = await SkillList.find({}).select('categoryId categoryName skills');
    
    return NextResponse.json({ 
      success: true, 
      data: skillLists 
    });
  } catch (error) {
    console.error('Error fetching skill lists:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch skill categories' 
    }, { status: 500 });
  }
}