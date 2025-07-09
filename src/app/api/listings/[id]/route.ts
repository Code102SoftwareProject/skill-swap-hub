// File: src/app/api/listings/[id]/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SkillListing from '@/lib/models/skillListing';
import SkillMatch from '@/lib/models/skillMatch';
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

// Helper function to check if listing is used in active matches
async function isListingUsedInMatches(listingId: string): Promise<{ isUsed: boolean; matchDetails: any[] }> {
  try {
    const activeMatches = await SkillMatch.find({
      $and: [
        {
          $or: [
            { listingOneId: listingId },
            { listingTwoId: listingId }
          ]
        },
        {
          status: { $in: ['pending', 'accepted'] } // Only active matches
        }
      ]
    });
    
    const matchDetails = activeMatches.map(match => ({
      matchId: match.id,
      matchType: match.matchType,
      status: match.status,
      matchPercentage: match.matchPercentage,
      otherListingId: match.listingOneId === listingId ? match.listingTwoId : match.listingOneId
    }));
    
    return { isUsed: activeMatches.length > 0, matchDetails };
  } catch (error) {
    console.error('Error checking listing usage in matches:', error);
    return { isUsed: false, matchDetails: [] };
  }
}

// Utility function to handle listing operations
async function handleListingOperation(request: NextRequest, id: string, operation: 'get' | 'update' | 'delete') {
  // Validate ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid listing ID' 
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
      const listing = await SkillListing.findById(id);
      
      if (!listing) {
        return NextResponse.json({ 
          success: false, 
          message: 'Listing not found' 
        }, { status: 404 });
      }
      
      // Check if listing is used in matches (for information purposes)
      const matchUsage = await isListingUsedInMatches(id);
      
      return NextResponse.json({ 
        success: true, 
        data: listing,
        isUsedInMatches: matchUsage.isUsed,
        matchDetails: matchUsage.matchDetails
      });
    }
    
    // For Update and Delete operations, verify ownership
    if (operation === 'update' || operation === 'delete') {
      const listing = await SkillListing.findById(id);
      
      if (!listing) {
        return NextResponse.json({ 
          success: false, 
          message: 'Listing not found' 
        }, { status: 404 });
      }
      
      // Check if the user is the owner of the listing
      if (listing.userId !== userId) {
        return NextResponse.json({ 
          success: false, 
          message: 'You do not have permission to modify this listing' 
        }, { status: 403 });
      }
      
      // NEW: Check if listing is used in active matches
      const matchUsage = await isListingUsedInMatches(id);
      if (matchUsage.isUsed) {
        const matchStatuses = matchUsage.matchDetails.map(m => `${m.matchType} (${m.status})`).join(', ');
        return NextResponse.json({
          success: false,
          message: `This listing cannot be modified because it is involved in active skill matches: ${matchStatuses}. Please complete or cancel the matches first.`,
          matchDetails: matchUsage.matchDetails
        }, { status: 400 });
      }
      
      // DELETE operation
      if (operation === 'delete') {
        await SkillListing.findByIdAndDelete(id);
        
        return NextResponse.json({
          success: true,
          message: 'Listing deleted successfully'
        });
      }
      
      // UPDATE operation
      if (operation === 'update') {
        const data = await request.json();
        
        // Validate data
        if (!data) {
          return NextResponse.json({ 
            success: false, 
            message: 'No data provided' 
          }, { status: 400 });
        }
        
        // Log what's being updated
        console.log('Updating listing:', id);
        console.log('Update data:', JSON.stringify(data, null, 2));
        
        // Validate offering and seeking if provided
        if (data.offering) {
          if (!data.offering.skillTitle || !data.offering.proficiencyLevel || !data.offering.description) {
            return NextResponse.json({ 
              success: false, 
              message: 'Missing required offering fields' 
            }, { status: 400 });
          }
        }
        
        if (data.seeking) {
          if (!data.seeking.categoryId || !data.seeking.categoryName || !data.seeking.skillTitle) {
            return NextResponse.json({ 
              success: false, 
              message: 'Missing required seeking fields' 
            }, { status: 400 });
          }
        }
        
        // Process tags if provided
        if (data.additionalInfo?.tags && typeof data.additionalInfo.tags === 'string') {
          data.additionalInfo.tags = data.additionalInfo.tags
            .split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean);
        }
        
        // Add updatedAt timestamp
        data.updatedAt = new Date();
        
        const updatedListing = await SkillListing.findByIdAndUpdate(
          id,
          { $set: data },
          { new: true }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Listing updated successfully',
          data: updatedListing
        });
      }
    }
    
    // Should never reach here
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid operation' 
    }, { status: 400 });
    
  } catch (error) {
    console.error(`Error in ${operation} operation:`, error);
    return NextResponse.json({ 
      success: false, 
      message: `Failed to ${operation} listing` 
    }, { status: 500 });
  }
}

// GET - Fetch a specific listing
export async function GET(request: NextRequest) {
  // Extract the listing ID from the URL path
  const url = request.url;
  const pathParts = url.split('/');
  const id = pathParts[pathParts.length - 1]; 
  
  // Handle trailing slash if present
  const listingId = id === '' ? pathParts[pathParts.length - 2] : id;
  
  return handleListingOperation(request, listingId, 'get');
}

// PUT - Update a listing
export async function PUT(request: NextRequest) {
  // Extract the listing ID from the URL path
  const url = request.url;
  const pathParts = url.split('/');
  const id = pathParts[pathParts.length - 1];
  
  // Handle trailing slash if present
  const listingId = id === '' ? pathParts[pathParts.length - 2] : id;
  
  return handleListingOperation(request, listingId, 'update');
}

// DELETE - Delete a listing
export async function DELETE(request: NextRequest) {
  // Extract the listing ID from the URL path
  const url = request.url;
  const pathParts = url.split('/');
  const id = pathParts[pathParts.length - 1];
  
  // Handle trailing slash if present
  const listingId = id === '' ? pathParts[pathParts.length - 2] : id;
  
  return handleListingOperation(request, listingId, 'delete');
}