import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import SkillList from '@/lib/models/skillList';
import { v4 as uuidv4 } from 'uuid';

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
    if (!body.categoryName) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    // Ensure skills is an array 
    const skills = Array.isArray(body.skills) ? body.skills : [];
    
    // Add skillId for each skill if not already provided
    const processedSkills = skills.map((skill: { skillId: any; }) => {
      if (typeof skill === 'string') {
        
        return { skillId: uuidv4(), name: skill };
      } else if (typeof skill === 'object') {
        // Ensure skill object has skillId
        return { 
          ...skill, 
          skillId: skill.skillId || uuidv4() 
        };
      }
      return { skillId: uuidv4(), name: String(skill) };
    });
    
    await connect();
    
    // Find the highest categoryId and increment by 1
    const highestCategory = await SkillList.findOne().sort({ categoryId: -1 });
    const newCategoryId = highestCategory ? highestCategory.categoryId + 1 : 1;
    
    const newSkillList = await SkillList.create({
      categoryId: newCategoryId,
      categoryName: body.categoryName,
      skills: processedSkills
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