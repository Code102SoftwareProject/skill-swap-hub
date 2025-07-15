import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import {Forum} from '@/lib/models/Forum';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Extract the forum ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1]; // Get the last segment
    
    // Handle trailing slash if present
    const forumId = id === '' ? pathParts[pathParts.length - 2] : id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return NextResponse.json(
        { error: 'Invalid forum ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const forum = await Forum.findById(forumId);

    if (!forum) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ forum });
  } catch (error) {
    console.error('Error fetching forum details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    // Extract the forum ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1]; 
    
    // Handle trailing slash if present
    const forumId = id === '' ? pathParts[pathParts.length - 2] : id;

    await connectToDatabase();
    
    const forum = await Forum.findByIdAndDelete(forumId);
    
    if (!forum) {
      return NextResponse.json(
        { message: 'Forum not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Forum deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting forum:', error);
    return NextResponse.json(
      { message: 'Failed to delete forum' },
      { status: 500 }
    );
  }
}

