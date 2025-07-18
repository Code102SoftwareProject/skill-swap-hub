// File: src/app/api/myskills/[id]/route.ts

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import UserSkill from '@/lib/models/userSkill';
import SkillListing from '@/lib/models/skillListing';
import SkillMatch from '@/lib/models/skillMatch';
import VerificationRequest from '@/lib/models/VerificationRequest';
import mongoose from 'mongoose';

// Helper function to get user ID from the token
function getUserIdFromToken(req: NextRequest): string | null {
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

// Helper function to check if skill is used in active matches
async function isSkillUsedInMatches(userId: string, skillTitle: string): Promise<{ isUsed: boolean; matchDetails: any[] }> {
  try {
    const activeMatches = await SkillMatch.find({
      $and: [
        {
          $or: [
            { userOneId: userId },
            { userTwoId: userId }
          ]
        },
        {
          status: { $in: ['pending', 'accepted'] } // Only active matches
        }
      ]
    });
    
    const matchDetails: any[] = [];
    
    for (const match of activeMatches) {
      const isUserOne = match.userOneId === userId;
      const myDetails = isUserOne ? match.userOneDetails : match.userTwoDetails;
      const otherDetails = isUserOne ? match.userTwoDetails : match.userOneDetails;
      
      // Check if this skill is involved in the match
      if (match.matchType === 'exact') {
        if (myDetails.offeringSkill === skillTitle || myDetails.seekingSkill === skillTitle) {
          matchDetails.push({
            matchId: match.id,
            matchType: 'exact',
            status: match.status,
            reason: `Skill "${skillTitle}" is part of exact match`
          });
        }
      } else if (match.matchType === 'partial') {
        // For partial matches, check if this skill is the one being used
        if (myDetails.offeringSkill === skillTitle && myDetails.offeringSkill === otherDetails.seekingSkill) {
          matchDetails.push({
            matchId: match.id,
            matchType: 'partial',
            status: match.status,
            reason: `Skill "${skillTitle}" is being offered in partial match`
          });
        }
        if (otherDetails.seekingSkill === skillTitle && myDetails.seekingSkill === otherDetails.offeringSkill) {
          matchDetails.push({
            matchId: match.id,
            matchType: 'partial',
            status: match.status,
            reason: `Skill "${skillTitle}" from your skill set is needed for partial match`
          });
        }
      }
    }
    
    return { isUsed: matchDetails.length > 0, matchDetails };
  } catch (error) {
    console.error('Error checking skill usage in matches:', error);
    return { isUsed: false, matchDetails: [] };
  }
}

// Utility function to handle skill operations without directly using params.id
async function handleSkillOperation(request: NextRequest, id: string, operation: 'get' | 'update' | 'delete') {
  // Validate ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid skill ID' 
    }, { status: 400 });
  }
  
  // Auth check
  const userId = getUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ 
      success: false, 
      message: 'Unauthorized' 
    }, { status: 401 });
  }
  
  try {
    await dbConnect();
    
    // GET operation
    if (operation === 'get') {
      const skill = await UserSkill.findOne({ _id: id, userId });
      
      if (!skill) {
        return NextResponse.json({ 
          success: false, 
          message: 'Skill not found' 
        }, { status: 404 });
      }
      
      // Check if this skill is used in any listings
      const listings = await SkillListing.find({ 
        userId, 
        'offering.skillId': id 
      });

      // Check if this skill has a pending verification request
      const pendingVerification = await VerificationRequest.findOne({
        userId,
        skillId: id,
        status: 'pending'
      });
      
      // Check if skill is used in active matches
      const matchUsage = await isSkillUsedInMatches(userId, skill.skillTitle);
      
      return NextResponse.json({ 
        success: true, 
        data: skill,
        isUsedInListing: listings.length > 0,
        hasPendingVerification: !!pendingVerification,
        isUsedInMatches: matchUsage.isUsed,
        matchDetails: matchUsage.matchDetails
      });
    }
    
    // For UPDATE and DELETE operations, check all protection conditions
    if (operation === 'update' || operation === 'delete') {
      const skill = await UserSkill.findOne({ _id: id, userId });
      
      if (!skill) {
        return NextResponse.json({ 
          success: false, 
          message: 'Skill not found' 
        }, { status: 404 });
      }
      
      // Check if skill is used in any listings
      const listings = await SkillListing.find({ 
        userId, 
        'offering.skillId': id 
      });
      
      if (listings.length > 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'This skill cannot be modified because it is being used in one or more active listings' 
        }, { status: 400 });
      }

      // Check if this skill has a pending verification request
      const pendingVerification = await VerificationRequest.findOne({
        userId,
        skillId: id,
        status: 'pending'
      });

      if (pendingVerification) {
        return NextResponse.json({
          success: false,
          message: 'This skill cannot be modified because it has a pending verification request'
        }, { status: 400 });
      }
      
      // NEW: Check if skill is used in active matches
      const matchUsage = await isSkillUsedInMatches(userId, skill.skillTitle);
      if (matchUsage.isUsed) {
        const matchTypes = matchUsage.matchDetails.map(m => m.matchType).join(', ');
        return NextResponse.json({
          success: false,
          message: `This skill cannot be modified because it is involved in active skill matches (${matchTypes}). Please complete or cancel the matches first.`,
          matchDetails: matchUsage.matchDetails
        }, { status: 400 });
      }
    }
    
    // DELETE operation
    if (operation === 'delete') {
      const result = await UserSkill.findOneAndDelete({ _id: id, userId });
      
      if (!result) {
        return NextResponse.json({ 
          success: false, 
          message: 'Skill not found' 
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Skill deleted successfully'
      });
    }
    
    // UPDATE operation
    if (operation === 'update') {
      const data = await request.json();
      
      // Validate required fields - now including all fields
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
      
      // Check if the skill title is already used by the user (only if title has changed)
      const existingSkill = await UserSkill.findOne(
        { 
          userId, 
          skillTitle,
          _id: { $ne: id } // Exclude the current skill being updated
        }
      );
      
      if (existingSkill) {
        return NextResponse.json({ 
          success: false, 
          message: 'You already have a skill with this title' 
        }, { status: 409 });
      }
      
      // Update all fields of the skill
      const result = await UserSkill.findOneAndUpdate(
        { _id: id, userId },
        { 
          $set: {
            categoryId,
            categoryName,
            skillTitle,
            proficiencyLevel,
            description,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      
      if (!result) {
        return NextResponse.json({ 
          success: false, 
          message: 'Skill not found' 
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Skill updated successfully',
        data: result
      });
    }
    
    // Should never reach here
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid operation' 
    }, { status: 400 });
    
  } catch (error) {
    console.error(`Error in ${operation} operation:`, error);
    
    // Check for duplicate key error
    if (error instanceof Error && error.name === 'MongoServerError' && (error as any).code === 11000) {
      return NextResponse.json({ 
        success: false, 
        message: 'You already have a skill with this title' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: `Failed to ${operation} skill` 
    }, { status: 500 });
  }
}

// GET - Fetch a specific user skill
export async function GET(request: NextRequest) {
  // Get ID from URL path segment
  const segments = request.nextUrl.pathname.split('/');
  const id = segments[segments.length - 1];
  
  return handleSkillOperation(request, id, 'get');
}

// PUT - Update a user skill
export async function PUT(request: NextRequest) {
  // Get ID from URL path segment
  const segments = request.nextUrl.pathname.split('/');
  const id = segments[segments.length - 1];
  
  return handleSkillOperation(request, id, 'update');
}

// DELETE - Delete a user skill
export async function DELETE(request: NextRequest) {
  // Get ID from URL path segment
  const segments = request.nextUrl.pathname.split('/');
  const id = segments[segments.length - 1];
  
  return handleSkillOperation(request, id, 'delete');
}