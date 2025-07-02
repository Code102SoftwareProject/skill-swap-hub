import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Work from '@/lib/models/workSchema';
import { Types } from 'mongoose';

// GET - Get works for a specific session
export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  await connect();
  try {
    const { sessionId } = params;

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const works = await Work.find({ session: new Types.ObjectId(sessionId) })
      .populate('session')
      .populate('provideUser', 'name email avatar')
      .populate('receiveUser', 'name email avatar')
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
