import { NextRequest, NextResponse } from 'next/server';
import  connect  from '@/lib/db';
import SkillList from '@/lib/models/skillList';

// GET all skill lists
export async function GET() {
  try {
    await connect();
    const skillLists = await SkillList.find({}).sort({ categoryName: 1 });
    return NextResponse.json(skillLists, { status: 200 });
  } catch (error) {
    console.error('Error fetching skill lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill lists' },
      { status: 500 }
    );
  }
}

// POST create a new skill list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.categoryName || !Array.isArray(body.skills)) {
      return NextResponse.json(
        { error: 'Category name and skills array are required' },
        { status: 400 }
      );
    }
    
    await connect();
    
    // Find the highest categoryId and increment by 1
    const highestCategory = await SkillList.findOne().sort({ categoryId: -1 });
    const newCategoryId = highestCategory ? highestCategory.categoryId + 1 : 1;
    
    const newSkillList = await SkillList.create({
      categoryId: newCategoryId,
      categoryName: body.categoryName,
      skills: body.skills
    });
    
    return NextResponse.json(newSkillList, { status: 201 });
  } catch (error) {
    console.error('Error creating skill list:', error);
    
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create skill list' },
      { status: 500 }
    );
  }
}