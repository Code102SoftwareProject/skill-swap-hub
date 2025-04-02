// File: src/app/api/listings/[id]/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SkillListing from '@/lib/models/skillListing';
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
      
      return NextResponse.json({ 
        success: true, 
        data: listing 
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
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return handleListingOperation(request, params.id, 'get');
}

// PUT - Update a listing
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return handleListingOperation(request, params.id, 'update');
}

// DELETE - Delete a listing
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return handleListingOperation(request, params.id, 'delete');
}