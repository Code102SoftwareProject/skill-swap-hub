import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import {Forum} from '@/lib/models/Forum';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid forum ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const forum = await Forum.findById(id);

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