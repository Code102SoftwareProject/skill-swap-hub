// File: src/app/api/matches/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SkillMatch from '@/lib/models/skillMatch';
import User from '@/lib/models/userSchema';

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

// GET - Fetch user's matches
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const matchType = url.searchParams.get('matchType');
    const status = url.searchParams.get('status');
    
    await dbConnect();
    
    // Build query
    const query: any = {
      $or: [
        { userOneId: userId },
        { userTwoId: userId }
      ]
    };
    
    // Filter by match type if provided
    if (matchType === 'exact') {
      query.matchType = 'exact';
    } else if (matchType === 'partial') {
      query.matchType = 'partial';
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Get matches
    const matches = await SkillMatch.find(query)
      .sort({ createdAt: -1 });
    
    // Get unique user IDs to fetch current avatar data
    const allUserIds = new Set<string>();
    matches.forEach(match => {
      allUserIds.add(match.userOneId);
      allUserIds.add(match.userTwoId);
    });
    
    // Fetch current user data for all users involved in matches
    const currentUserData = await User.find(
      { _id: { $in: Array.from(allUserIds) } },
      'firstName lastName avatar'
    ).lean();
    
    // Create a map for quick lookup
    const userDataMap = new Map();
    currentUserData.forEach(user => {
      userDataMap.set(user._id.toString(), user);
    });
    
    // Transform matches to identify the current user's perspective with updated avatars
    const transformedMatches = matches.map(match => {
      const isUserOne = match.userOneId === userId;
      const otherUserId = isUserOne ? match.userTwoId : match.userOneId;
      const otherUserData = userDataMap.get(otherUserId) || {};
      const currentUserData = userDataMap.get(userId) || {};
      
      return {
        id: match.id,
        matchPercentage: match.matchPercentage,
        matchType: match.matchType,
        status: match.status,
        createdAt: match.createdAt,
        // Current user's data with updated avatar
        myDetails: {
          ...(isUserOne ? match.userOneDetails : match.userTwoDetails),
          firstName: currentUserData.firstName || (isUserOne ? match.userOneDetails.firstName : match.userTwoDetails.firstName),
          lastName: currentUserData.lastName || (isUserOne ? match.userOneDetails.lastName : match.userTwoDetails.lastName),
          avatar: currentUserData.avatar
        },
        myListingId: isUserOne ? match.listingOneId : match.listingTwoId,
        // Other user's data with updated avatar
        otherUser: {
          userId: otherUserId,
          listingId: isUserOne ? match.listingTwoId : match.listingOneId,
          firstName: otherUserData.firstName || (isUserOne ? match.userTwoDetails.firstName : match.userOneDetails.firstName),
          lastName: otherUserData.lastName || (isUserOne ? match.userTwoDetails.lastName : match.userOneDetails.lastName),
          avatar: otherUserData.avatar,
          offeringSkill: isUserOne ? match.userTwoDetails.offeringSkill : match.userOneDetails.offeringSkill,
          seekingSkill: isUserOne ? match.userTwoDetails.seekingSkill : match.userOneDetails.seekingSkill
        }
      };
    });
    
    return NextResponse.json({
      success: true,
      data: transformedMatches
    });
    
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch matches' 
    }, { status: 500 });
  }
}