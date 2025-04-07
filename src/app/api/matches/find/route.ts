// File: src/app/api/matches/find/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SkillListing from '@/lib/models/skillListing';
import User from '@/lib/models/userSchema';
import SkillMatch from '@/lib/models/skillMatch';

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

// Helper function to extract user ID properly
function extractUserId(user: any): string {
  if (!user) return '';
  
  // If it's already a string, return it
  if (typeof user === 'string') return user;
  
  // If it's a mongoose object with _id
  if (user._id) {
    // Convert ObjectId to string if needed
    return user._id.toString ? user._id.toString() : user._id;
  }
  
  // If it's a populated document with id
  if (user.id) {
    return user.id.toString();
  }
  
  console.error('Unable to extract user ID from:', user);
  return '';
}

// POST - Find matches for all user's listings
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get all active listings by the current user
    const userListings = await SkillListing.find({ 
      userId, 
      status: 'active' 
    });
    
    if (userListings.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No active listings found to match',
        data: []
      });
    }
    
    const matches = [];
    
    // For each of user's listings, find potential matches
    for (const userListing of userListings) {
      // Exact matches: My offering matches their seeking AND my seeking matches their offering
      const exactMatches = await SkillListing.find({
        userId: { $ne: userId },  // Not my own listings
        status: 'active',         // Only active listings
        'offering.skillTitle': userListing.seeking.skillTitle,  // Their offering is what I seek
        'seeking.skillTitle': userListing.offering.skillTitle   // They seek what I offer
      }).populate({
        path: 'userId',
        model: User,
        select: 'firstName lastName avatar'
      });
      
      // Partial matches: Either my offering matches their seeking OR my seeking matches their offering
      const partialMatches = await SkillListing.find({
        userId: { $ne: userId },  // Not my own listings
        status: 'active',         // Only active listings
        $or: [
          { 'offering.skillTitle': userListing.seeking.skillTitle },  // Their offering is what I seek
          { 'seeking.skillTitle': userListing.offering.skillTitle }   // They seek what I offer
        ],
        // Exclude exact matches
        $nor: [
          {
            'offering.skillTitle': userListing.seeking.skillTitle,  
            'seeking.skillTitle': userListing.offering.skillTitle
          }
        ]
      }).populate({
        path: 'userId',
        model: User,
        select: 'firstName lastName avatar'
      });
      
      // Process exact matches
      for (const match of exactMatches) {
        // Extract the user ID properly
        const matchUserId = extractUserId(match.userId);
        
        // Check if this match already exists in the database
        const existingMatch = await SkillMatch.findOne({
          $or: [
            { listingOneId: userListing.id, listingTwoId: match.id },
            { listingOneId: match.id, listingTwoId: userListing.id }
          ]
        });
        
        if (!existingMatch) {
          // Create a new match record
          const newMatch = new SkillMatch({
            listingOneId: userListing.id,
            listingTwoId: match.id,
            userOneId: userId,
            userTwoId: matchUserId, // Fixed: Use the extracted ID
            matchPercentage: 100,
            matchType: 'exact',
            status: 'pending',
            userOneDetails: {
              firstName: userListing.userDetails.firstName,
              lastName: userListing.userDetails.lastName,
              avatar: userListing.userDetails.avatar,
              offeringSkill: userListing.offering.skillTitle,
              seekingSkill: userListing.seeking.skillTitle
            },
            userTwoDetails: {
              firstName: match.userDetails.firstName,
              lastName: match.userDetails.lastName,
              avatar: match.userDetails.avatar,
              offeringSkill: match.offering.skillTitle,
              seekingSkill: match.seeking.skillTitle
            }
          });
          
          await newMatch.save();
          matches.push(newMatch);
        } else {
          matches.push(existingMatch);
        }
      }
      
      // Process partial matches
      for (const match of partialMatches) {
        // Extract the user ID properly
        const matchUserId = extractUserId(match.userId);
        
        // Check if this match already exists in the database
        const existingMatch = await SkillMatch.findOne({
          $or: [
            { listingOneId: userListing.id, listingTwoId: match.id },
            { listingOneId: match.id, listingTwoId: userListing.id }
          ]
        });
        
        if (!existingMatch) {
          // Create a new match record
          const newMatch = new SkillMatch({
            listingOneId: userListing.id,
            listingTwoId: match.id,
            userOneId: userId,
            userTwoId: matchUserId, // Fixed: Use the extracted ID
            matchPercentage: 50,
            matchType: 'partial',
            status: 'pending',
            userOneDetails: {
              firstName: userListing.userDetails.firstName,
              lastName: userListing.userDetails.lastName,
              avatar: userListing.userDetails.avatar,
              offeringSkill: userListing.offering.skillTitle,
              seekingSkill: userListing.seeking.skillTitle
            },
            userTwoDetails: {
              firstName: match.userDetails.firstName,
              lastName: match.userDetails.lastName,
              avatar: match.userDetails.avatar,
              offeringSkill: match.offering.skillTitle,
              seekingSkill: match.seeking.skillTitle
            }
          });
          
          await newMatch.save();
          matches.push(newMatch);
        } else {
          matches.push(existingMatch);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Found ${matches.length} potential matches`,
      data: matches
    });
    
  } catch (error) {
    console.error('Error finding matches:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to find matches' 
    }, { status: 500 });
  }
}