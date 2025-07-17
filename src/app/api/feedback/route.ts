// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import connect  from '@/lib/db'; // your custom DB connection file
import { Feedback }  from '@/lib/models/feedbackSchema';
import User from "@/lib/models/userSchema";
import { Types } from 'mongoose';

export async function POST(req: Request) {
  try {
    await connect();

    const body = await req.json();
    const {
      userId,
      feedback,
      successStory,
      rating,
      canSuccessStoryPost,
      displayName,
      isAnonymous,
    } = body;

    if (!userId || !feedback || !rating) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    let finalDisplayName = displayName;

    // fallback to user's name if not anonymous and displayName not given
    if (!isAnonymous && !displayName) {
      const user = await User.findById(userId).select('name');
      finalDisplayName = user?.name || 'User';
    }

    const newFeedback = await Feedback.create({
      userId: new Types.ObjectId(userId),
      feedback,
      successStory: successStory || '',
      rating,
      canSuccessStoryPost,
      displayName: isAnonymous ? undefined : finalDisplayName,
      isAnonymous,
      // no need to send: date, isPublished, adminTitle → defaulted in schema
    });

    return NextResponse.json({ message: 'Feedback submitted!', feedback: newFeedback }, { status: 201 });

  } catch (err: any) {
    console.error('[POST /api/feedback]', err);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
