import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Work from '@/lib/models/workSchema';
import { Types } from 'mongoose';

// POST - Create a new work submission
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const { session, provideUser, receiveUser, workURL, workDescription } = body;

    // Validate required fields
    if (!session || !provideUser || !receiveUser || !workDescription) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
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

    const work = await Work.create({
      session: new Types.ObjectId(session),
      provideUser: new Types.ObjectId(provideUser),
      receiveUser: new Types.ObjectId(receiveUser),
      workURL: workURL || 'text-only',
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
