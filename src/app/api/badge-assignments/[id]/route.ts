import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import '@/lib/models/badgeSchema'; // <-- Import badgeSchema BEFORE BadgeAssignment
import BadgeAssignment from '@/lib/models/badgeAssignmentSchema';
import connect from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ← PROMISE here
): Promise<NextResponse> {
  const { id: userId } = await params;         // ← AWAIT here

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    await connect();

    const badgeAssignments = await BadgeAssignment.find({ userId })
      .populate('badgeId')
      .sort({ assignedAt: -1 });

    const responseData = badgeAssignments.map((assignment) => ({
      id: assignment._id,
      badge: {
        id: assignment.badgeId._id,
        badgeName: assignment.badgeId.badgeName,
        badgeImage: assignment.badgeId.badgeImage,
        criteria: assignment.badgeId.criteria,
        description: assignment.badgeId.description
      },
      assignedAt: assignment.assignedAt,
      context: assignment.assignmentContext
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching badge assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
