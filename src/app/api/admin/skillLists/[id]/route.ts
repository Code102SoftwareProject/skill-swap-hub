import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import SkillList from '@/lib/models/skillList';
import { v4 as uuidv4 } from 'uuid';

// Helper function to extract ID from URL pathname
function getIdFromPathname(pathname: string): string {
  const segments = pathname.split('/');
  return segments[segments.length - 1];
}

// GET a specific skill list by ID
export async function GET(request: NextRequest) {
  try {
   
    const requestId = getIdFromPathname(request.nextUrl.pathname);
    
    await connect();
    
    const skillList = await SkillList.findOne({ categoryId: parseInt(requestId) });
    
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
export async function PUT(request: NextRequest) {
  try {

    const requestId = getIdFromPathname(request.nextUrl.pathname);
    const body = await request.json();
    
    await connect();
    
    // Check if skill list exists
    const skillList = await SkillList.findOne({ categoryId: parseInt(requestId) });
    
    if (!skillList) {
      return NextResponse.json(
        { error: 'Skill list not found' },
        { status: 404 }
      );
    }
    
    // Update category name if provided
    if (body.categoryName) {
      skillList.categoryName = body.categoryName;
    }
    
    // Process any skills provided in the request
    if (body.skills) {
      // Process incoming skills to ensure they have skillId
      const processSkill = (skill: any) => {
        if (typeof skill === 'string') {
        
          return { skillId: uuidv4(), name: skill };
        } else if (typeof skill === 'object') {
          // Ensure skill object has skillId
          return { 
            ...skill,
            skillId: skill.skillId || uuidv4(),
            name: skill.name || ''
          };
        }
        return { skillId: uuidv4(), name: String(skill) };
      };
      
      const processedSkills = body.skills.map(processSkill);
      
      // Check if we should append skills or replace them
      if (body.appendSkills === true) {
        // Create a map of existing skills by skillId for quick lookup
        const existingSkillsMap = new Map(
          skillList.skills.map((skill: { skillId: any; }) => [skill.skillId, skill])
        );
        
        // Process and add new skills
        for (const newSkill of processedSkills) {
          if (!existingSkillsMap.has(newSkill.skillId)) {
            skillList.skills.push(newSkill);
          }
        }
      } else {
        // Replace all skills
        skillList.skills = processedSkills;
      }
    }
    
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
export async function DELETE(request: NextRequest) {
  try {
    
    const requestId = getIdFromPathname(request.nextUrl.pathname);
    
    await connect();
    
    const result = await SkillList.deleteOne({ categoryId: parseInt(requestId) });
    
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