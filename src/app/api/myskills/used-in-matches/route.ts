// File: src/app/api/myskills/used-in-matches/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SkillMatch from '@/lib/models/skillMatch';
import UserSkill from '@/lib/models/userSkill';

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

// GET - Check which user's skills are used in active matches
export async function GET(request: NextRequest) {
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
    
    // Get user's skills
    const userSkills = await UserSkill.find({ userId });
    const userSkillTitles = userSkills.map(skill => skill.skillTitle);
    const userSkillIds = userSkills.map(skill => skill.id);
    
    // Find all active matches where this user is involved
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
    
    const usedSkillIds = new Set<string>();
    const usedSkillTitles = new Set<string>();
    const matchDetails: any[] = [];
    
    // Check each match to see which skills are being used
    for (const match of activeMatches) {
      const isUserOne = match.userOneId === userId;
      const myDetails = isUserOne ? match.userOneDetails : match.userTwoDetails;
      const otherDetails = isUserOne ? match.userTwoDetails : match.userOneDetails;
      
      // Skills being offered/sought in this match
      const myOfferingSkill = myDetails.offeringSkill;
      const mySeekingSkill = myDetails.seekingSkill;
      const otherOfferingSkill = otherDetails.offeringSkill;
      const otherSeekingSkill = otherDetails.seekingSkill;
      
      // For exact matches: both offering and seeking skills are "used"
      if (match.matchType === 'exact') {
        usedSkillTitles.add(myOfferingSkill);
        usedSkillTitles.add(mySeekingSkill);
        
        // Find skill IDs for these titles
        const offeringSkillObj = userSkills.find(s => s.skillTitle === myOfferingSkill);
        const seekingSkillObj = userSkills.find(s => s.skillTitle === mySeekingSkill);
        
        if (offeringSkillObj) usedSkillIds.add(offeringSkillObj.id);
        if (seekingSkillObj) usedSkillIds.add(seekingSkillObj.id);
        
        matchDetails.push({
          matchId: match.id,
          matchType: 'exact',
          usedSkills: [myOfferingSkill, mySeekingSkill],
          reason: 'Both offering and seeking skills are involved in exact match'
        });
      }
      
      // For partial matches: check which of my skills is being used
      else if (match.matchType === 'partial') {
        // Case 1: I'm offering what they seek (my offering skill is used)
        if (myOfferingSkill === otherSeekingSkill) {
          usedSkillTitles.add(myOfferingSkill);
          const skillObj = userSkills.find(s => s.skillTitle === myOfferingSkill);
          if (skillObj) usedSkillIds.add(skillObj.id);
          
          matchDetails.push({
            matchId: match.id,
            matchType: 'partial',
            usedSkills: [myOfferingSkill],
            reason: 'Your offering skill matches their seeking skill'
          });
        }
        
        // Case 2: They're offering what I seek, but I have the skill they want in my skill set
        if (otherOfferingSkill === mySeekingSkill && userSkillTitles.includes(otherSeekingSkill)) {
          usedSkillTitles.add(otherSeekingSkill); // The skill from my skill set that they want
          const skillObj = userSkills.find(s => s.skillTitle === otherSeekingSkill);
          if (skillObj) usedSkillIds.add(skillObj.id);
          
          matchDetails.push({
            matchId: match.id,
            matchType: 'partial',
            usedSkills: [otherSeekingSkill],
            reason: 'Your skill from skill set matches their seeking skill'
          });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        usedSkillIds: Array.from(usedSkillIds),
        usedSkillTitles: Array.from(usedSkillTitles),
        matchDetails: matchDetails,
        totalActiveMatches: activeMatches.length
      }
    });
  } catch (error) {
    console.error('Error checking skills used in matches:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to check skills used in matches' 
    }, { status: 500 });
  }
}