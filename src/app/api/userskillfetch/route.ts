export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import UserSkill from '@/lib/models/userSkill';

export async function GET(req: Request) {
  try {
    // Get userId from URL query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }
    
    await connect();
    
    // Fetch the user's skills
    const userSkills = await UserSkill.find({ userId });
    
    // Group skills by category
    const skillsByCategory: Record<string, any> = {};
    
    userSkills.forEach(skill => {
      const { categoryId, categoryName } = skill;
      
      if (!skillsByCategory[categoryId]) {
        skillsByCategory[categoryId] = {
          categoryId,
          categoryName,
          skills: []
        };
      }
      
      skillsByCategory[categoryId].skills.push({
        id: skill.id,
        skillTitle: skill.skillTitle,
        proficiencyLevel: skill.proficiencyLevel,
        description: skill.description,
        isVerified: skill.isVerified,
        createdAt: skill.createdAt
      });
    });
    
    return NextResponse.json({ 
      success: true, 
      userId,
      categories: Object.values(skillsByCategory)
    });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch user skills' 
    }, { status: 500 });
  }
}