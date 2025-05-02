import { NextRequest, NextResponse } from 'next/server';
import connect  from '@/lib/db';
import SkillList from '@/lib/models/skillList';

interface Params {
  params: {
    id: string;
  };
}

// GET a specific skill list by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    await connect();
    
    const skillList = await SkillList.findOne({ categoryId: parseInt(id) });
    
    if (!skillList) {
      return NextResponse.json(
        { error: 'Skill list not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(skillList, { status: 200 });
  } catch (error) {
    console.error('Error fetching skill list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill list' },
      { status: 500 }
    );
  }
}

// PUT update a skill list
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    
    await connect();
    
    // Check if skill list exists
    const skillList = await SkillList.findOne({ categoryId: parseInt(id) });
    
    if (!skillList) {
      return NextResponse.json(
        { error: 'Skill list not found' },
        { status: 404 }
      );
    }
    
    // Update fields if provided
    if (body.categoryName) skillList.categoryName = body.categoryName;
    if (body.skills) skillList.skills = body.skills;
    
    await skillList.save();
    
    return NextResponse.json(skillList, { status: 200 });
  } catch (error) {
    console.error('Error updating skill list:', error);
    
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update skill list' },
      { status: 500 }
    );
  }
}

// DELETE a skill list
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    await connect();
    
    const result = await SkillList.deleteOne({ categoryId: parseInt(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Skill list not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Skill list deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting skill list:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill list' },
      { status: 500 }
    );
  }
}