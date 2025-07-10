// File: src/app/api/listings/used-in-matches/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SkillMatch from '@/lib/models/skillMatch';
import SkillListing from '@/lib/models/skillListing';

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

// GET - Check which user's listings are used in active matches
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
    
    // Get all user's listings
    const userListings = await SkillListing.find({ userId });
    const userListingIds = userListings.map(listing => listing.id);
    
    // Find all active matches where user's listings are involved
    const activeMatches = await SkillMatch.find({
      $and: [
        {
          $or: [
            { listingOneId: { $in: userListingIds } },
            { listingTwoId: { $in: userListingIds } }
          ]
        },
        {
          status: { $in: ['pending', 'accepted'] } // Only active matches
        }
      ]
    });
    
    const usedListingIds = new Set<string>();
    const listingMatchDetails: { [listingId: string]: any[] } = {};
    
    // Process each match to identify which listings are involved
    for (const match of activeMatches) {
      // Check if listingOne belongs to user
      if (userListingIds.includes(match.listingOneId)) {
        usedListingIds.add(match.listingOneId);
        
        if (!listingMatchDetails[match.listingOneId]) {
          listingMatchDetails[match.listingOneId] = [];
        }
        
        listingMatchDetails[match.listingOneId].push({
          matchId: match.id,
          matchType: match.matchType,
          matchPercentage: match.matchPercentage,
          status: match.status,
          otherListingId: match.listingTwoId,
          otherUserDetails: match.userTwoDetails,
          createdAt: match.createdAt,
          role: 'listingOne',
          reason: `Your listing is matched with another user's skill exchange`
        });
      }
      
      // Check if listingTwo belongs to user
      if (userListingIds.includes(match.listingTwoId)) {
        usedListingIds.add(match.listingTwoId);
        
        if (!listingMatchDetails[match.listingTwoId]) {
          listingMatchDetails[match.listingTwoId] = [];
        }
        
        listingMatchDetails[match.listingTwoId].push({
          matchId: match.id,
          matchType: match.matchType,
          matchPercentage: match.matchPercentage,
          status: match.status,
          otherListingId: match.listingOneId,
          otherUserDetails: match.userOneDetails,
          createdAt: match.createdAt,
          role: 'listingTwo',
          reason: `Your listing is matched with another user's skill exchange`
        });
      }
    }
    
    // Get summary statistics
    const totalActiveMatches = activeMatches.length;
    const uniqueOtherUsers = new Set();
    
    Object.values(listingMatchDetails).forEach(matches => {
      matches.forEach(match => {
        const otherUserId = match.role === 'listingOne' ? 
          activeMatches.find(m => m.id === match.matchId)?.userTwoId :
          activeMatches.find(m => m.id === match.matchId)?.userOneId;
        if (otherUserId) uniqueOtherUsers.add(otherUserId);
      });
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        usedListingIds: Array.from(usedListingIds),
        listingMatchDetails: listingMatchDetails,
        totalActiveMatches: totalActiveMatches,
        totalProtectedListings: usedListingIds.size,
        totalMatchedUsers: uniqueOtherUsers.size,
        summary: {
          pendingMatches: activeMatches.filter(m => m.status === 'pending').length,
          acceptedMatches: activeMatches.filter(m => m.status === 'accepted').length,
          exactMatches: activeMatches.filter(m => m.matchType === 'exact').length,
          partialMatches: activeMatches.filter(m => m.matchType === 'partial').length
        }
      }
    });
  } catch (error) {
    console.error('Error checking listings used in matches:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to check listings used in matches' 
    }, { status: 500 });
  }
}