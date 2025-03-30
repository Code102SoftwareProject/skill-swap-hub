// File: src/app/api/myskills/[id]/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import UserSkill from '@/lib/models/userSkill';
import mongoose from 'mongoose';

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

// GET - Fetch a specific user skill
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const skillId = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid skill ID' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    const skill = await UserSkill.findOne({
      _id: skillId,
      userId
    });
    
    if (!skill) {
      return NextResponse.json({ 
        success: false, 
        message: 'Skill not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: skill 
    });
  } catch (error) {
    console.error('Error fetching skill:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch skill' 
    }, { status: 500 });
  }
}

// PUT - Update a user skill
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const skillId = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid skill ID' 
      }, { status: 400 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    const { proficiencyLevel, description } = data;
    
    if (!proficiencyLevel || !description) {
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
    
    // Update the skill
    const result = await UserSkill.updateOne(
      { _id: skillId, userId },
      { 
        $set: {
          proficiencyLevel,
          description,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Skill not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Skill updated successfully'
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update skill' 
    }, { status: 500 });
  }
}

// DELETE - Delete a user skill
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const skillId = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid skill ID' 
      }, { status: 400 });
    }
    
    await dbConnect();
    
    // Delete the skill
    const result = await UserSkill.deleteOne({
      _id: skillId,
      userId
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Skill not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete skill' 
    }, { status: 500 });
  }
}