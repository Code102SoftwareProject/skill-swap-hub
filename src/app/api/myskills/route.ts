import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import UserSkill from '@/lib/models/userSkill';

// Helper function to get user ID from the token
function getUserIdFromToken(req: Request): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// GET - Fetch user's skills
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    await dbConnect();
    
    const userSkills = await UserSkill.find({ userId });
    
    return NextResponse.json({ 
      success: true, 
      data: userSkills 
    });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch user skills' 
    }, { status: 500 });
  }
}

// POST - Add a new skill for the user
export async function POST(req: Request) {
  try {
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    const { categoryId, categoryName, skillTitle, proficiencyLevel, description } = data;
    
    if (!categoryId || !categoryName || !skillTitle || !proficiencyLevel || !description) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Validate description length
    if (description.length < 10) {
      return NextResponse.json({ 
        success: false, 
        message: 'Description must be at least 10 characters' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // Check if the skill already exists for the user
    const existingSkill = await UserSkill.findOne({
      userId,
      skillTitle
    });
    
    if (existingSkill) {
      return NextResponse.json({ 
        success: false, 
        message: 'You already have this skill added' 
      }, { status: 409 });
    }
    
    // Add the new skill
    const newSkill = new UserSkill({
      userId,
      categoryId,
      categoryName,
      skillTitle,
      proficiencyLevel,
      description,
      createdAt: new Date()
    });
    
    await newSkill.save();
    
    return NextResponse.json({
      success: true,
      message: 'Skill added successfully',
      data: {
        skillId: newSkill._id
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to add skill' 
    }, { status: 500 });
  }
}