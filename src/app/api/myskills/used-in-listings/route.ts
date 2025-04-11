// File: src/app/api/myskills/used-in-listings/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
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

// GET - Check which skills are used in listings
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
    
    // Find all listings by this user
    const listings = await SkillListing.find({ userId });
    
    // Extract skill IDs used in listings
    const usedSkillIds = listings
      .map(listing => listing.offering.skillId)
      .filter(Boolean); // Filter out any undefined or null values
    
    return NextResponse.json({ 
      success: true, 
      data: usedSkillIds 
    });
  } catch (error) {
    console.error('Error checking skills used in listings:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to check skills used in listings' 
    }, { status: 500 });
  }
}