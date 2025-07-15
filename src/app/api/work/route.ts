import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Work from '@/lib/models/workSchema';
import { Types } from 'mongoose';

// POST - Create a new work submission
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const { session, provideUser, receiveUser, workURL, workFiles, workDescription } = body;

    // Validate required fields
    if (!session || !provideUser || !receiveUser || !workDescription) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that either workURL (legacy) or workFiles is provided
    if (!workURL && (!workFiles || workFiles.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Either workURL or workFiles must be provided' },
        { status: 400 }
      );
    }

    // Validate ObjectId formats
    if (!Types.ObjectId.isValid(session)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(provideUser)) {
      return NextResponse.json(
        { success: false, message: 'Invalid provide user ID format' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(receiveUser)) {
      return NextResponse.json(
        { success: false, message: 'Invalid receive user ID format' },
        { status: 400 }
      );
    }

    // Validate workFiles if provided
    if (workFiles && workFiles.length > 0) {
      // Check maximum number of files
      if (workFiles.length > 5) {
        return NextResponse.json(
          { success: false, message: 'Maximum 5 files allowed per work submission' },
          { status: 400 }
        );
      }

      // Validate each file
      for (const [index, file] of workFiles.entries()) {
        if (!file.fileName || !file.fileURL || !file.fileTitle) {
          return NextResponse.json(
            { success: false, message: `File ${index + 1}: fileName, fileURL, and fileTitle are required` },
            { status: 400 }
          );
        }

        // Auto-generate title if empty
        if (!file.fileTitle.trim()) {
          file.fileTitle = file.fileName.split('.').slice(0, -1).join('.') || `File ${index + 1}`;
        }
      }
    }

    const work = await Work.create({
      session: new Types.ObjectId(session),
      provideUser: new Types.ObjectId(provideUser),
      receiveUser: new Types.ObjectId(receiveUser),
      workURL: workURL || 'text-only', // Keep for backwards compatibility
      workFiles: workFiles || [], // New field for multiple files
      workDescription,
      provideDate: new Date(),
      acceptanceStatus: 'pending'
    });

    const populatedWork = await Work.findById(work._id)
      .populate('session')
      .populate('provideUser', 'firstName lastName email avatar title')
      .populate('receiveUser', 'firstName lastName email avatar title');

    return NextResponse.json({
      success: true,
      work: populatedWork
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Get all works (with optional filters)
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let filter: any = {};

    if (sessionId) {
      if (!Types.ObjectId.isValid(sessionId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid session ID format' },
          { status: 400 }
        );
      }
      filter.session = new Types.ObjectId(sessionId);
    }

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user ID format' },
          { status: 400 }
        );
      }
      filter.$or = [
        { provideUser: new Types.ObjectId(userId) },
        { receiveUser: new Types.ObjectId(userId) }
      ];
    }

    if (status) {
      filter.acceptanceStatus = status;
    }

    const works = await Work.find(filter)
      .populate('session')
      .populate('provideUser', 'firstName lastName email avatar title')
      .populate('receiveUser', 'firstName lastName email avatar title')
      .sort({ provideDate: -1 });

    return NextResponse.json({
      success: true,
      works
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
