// File: src/app/api/listings/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SkillListing from '@/lib/models/skillListing';
import User from '@/lib/models/userSchema';

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

// GET - Fetch all listings or user's listings
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
    
    // Get query parameters
    const url = new URL(req.url);
    const queryType = url.searchParams.get('type');
    
    let query = {};
    
    // Filter by type if provided
    if (queryType === 'mine') {
      // Show only the user's listings
      query = { userId };
    } else if (queryType === 'other') {
      // Show other users' listings (not the current user's)
      query = { userId: { $ne: userId } };
    }
    // If no type specified, return all listings
    
    const listings = await SkillListing.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(100); // Limit to 100 listings for performance
    
    return NextResponse.json({ 
      success: true, 
      data: listings 
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch listings' 
    }, { status: 500 });
  }
}

// POST - Create a new listing
export async function POST(req: Request) {
  try {
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get user details to include in the listing
    const user = await User.findById(userId).select('firstName lastName avatar');
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    const { offering, seeking, additionalInfo } = data;
    
    if (!offering || !seeking || !additionalInfo) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Validate offering fields
    if (!offering.categoryId || !offering.categoryName || !offering.skillTitle || !offering.proficiencyLevel || !offering.description) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required offering fields' 
      }, { status: 400 });
    }
    
    // Validate seeking fields
    if (!seeking.categoryId || !seeking.categoryName || !seeking.skillTitle) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required seeking fields' 
      }, { status: 400 });
    }
    
    // Validate description
    if (!additionalInfo.description || additionalInfo.description.length < 10) {
      return NextResponse.json({ 
        success: false, 
        message: 'Description must be at least 10 characters' 
      }, { status: 400 });
    }
    
    // Process tags if provided
    if (additionalInfo.tags && typeof additionalInfo.tags === 'string') {
      additionalInfo.tags = additionalInfo.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter(Boolean);
    }
    
    // Create the new listing with default 'active' status
    const newListing = new SkillListing({
      userId,
      userDetails: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      },
      offering,
      seeking,
      additionalInfo,
      status: 'active' // Default to active status
    });
    
    await newListing.save();
    
    return NextResponse.json({
      success: true,
      message: 'Listing created successfully',
      data: newListing
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create listing' 
    }, { status: 500 });
  }
}