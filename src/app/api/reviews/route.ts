import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/db';
import Review from '@/lib/models/reviewSchema';
import Session from '@/lib/models/sessionSchema';
import User from '@/lib/models/userSchema';

// POST - Create a review
export async function POST(req: NextRequest) {
  try {
    await connect();
    
    const body = await req.json();
    const { sessionId, reviewerId, revieweeId, rating, comment } = body;

    // Validate required fields
    if (!sessionId || !reviewerId || !revieweeId || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate rating is integer between 1-5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if session exists and is completed
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: "Can only review completed sessions" },
        { status: 400 }
      );
    }

    // Verify the reviewer is part of this session
    const isUser1 = session.user1Id.toString() === reviewerId;
    const isUser2 = session.user2Id.toString() === reviewerId;
    
    if (!isUser1 && !isUser2) {
      return NextResponse.json(
        { success: false, message: "You are not a participant in this session" },
        { status: 403 }
      );
    }

    // Verify reviewee is the other user in the session
    const otherUserId = isUser1 ? session.user2Id.toString() : session.user1Id.toString();
    if (revieweeId !== otherUserId) {
      return NextResponse.json(
        { success: false, message: "You can only review the other participant in this session" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      sessionId,
      reviewerId
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: "You have already reviewed this session" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await Review.create({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      reviewerId: new mongoose.Types.ObjectId(reviewerId),
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
      rating: parseInt(rating),
      comment: comment.trim(),
      isVisible: true
    });

    // Populate the review with user information
    const populatedReview = await Review.findById(review._id)
      .populate('reviewerId', 'firstName lastName name')
      .populate('revieweeId', 'firstName lastName name');

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review: populatedReview
    }, { status: 201 });

  } catch (error: any) {
    console.error('Review creation error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Get reviews for a session
export async function GET(req: NextRequest) {
  try {
    await connect();
    
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get reviews for this session
    const reviews = await Review.find({ 
      sessionId: new mongoose.Types.ObjectId(sessionId),
      isVisible: true 
    })
      .populate('reviewerId', 'firstName lastName name')
      .populate('revieweeId', 'firstName lastName name')
      .sort({ createdAt: -1 });

    // If userId provided, get specific review info
    let userReview = null;
    let receivedReview = null;
    
    if (userId) {
      userReview = reviews.find(r => r.reviewerId._id.toString() === userId);
      receivedReview = reviews.find(r => r.revieweeId._id.toString() === userId);
    }

    return NextResponse.json({
      success: true,
      reviews,
      userReview: userReview || null,
      receivedReview: receivedReview || null,
      totalReviews: reviews.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
