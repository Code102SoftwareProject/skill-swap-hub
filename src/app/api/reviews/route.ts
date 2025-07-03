import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/db';
import Review from '@/lib/models/reviewSchema';
import Session from '@/lib/models/sessionSchema';
import User from '@/lib/models/userSchema';
import UserSkill from '@/lib/models/userSkill';

// POST - Create a review
export async function POST(req: NextRequest) {
  try {
    await connect();
    
    const body = await req.json();
    const { sessionId, reviewerId, revieweeId, rating, comment, skillId, reviewType } = body;

    // Validate required fields
    if (!sessionId || !reviewerId || !revieweeId || !rating || !comment || !skillId || !reviewType) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate review type
    if (!['skill_teaching', 'skill_learning'].includes(reviewType)) {
      return NextResponse.json(
        { success: false, message: "Review type must be 'skill_teaching' or 'skill_learning'" },
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

    const reviewerIdObj = new mongoose.Types.ObjectId(reviewerId);
    const revieweeIdObj = new mongoose.Types.ObjectId(revieweeId);

    // Check if reviewer is part of the session
    if (!session.user1Id.equals(reviewerIdObj) && !session.user2Id.equals(reviewerIdObj)) {
      return NextResponse.json(
        { success: false, message: "Reviewer is not part of this session" },
        { status: 403 }
      );
    }

    // Check if reviewee is the other person in the session
    if (!session.user1Id.equals(revieweeIdObj) && !session.user2Id.equals(revieweeIdObj)) {
      return NextResponse.json(
        { success: false, message: "Reviewee is not part of this session" },
        { status: 403 }
      );
    }

    // Check if reviewer and reviewee are different
    if (reviewerIdObj.equals(revieweeIdObj)) {
      return NextResponse.json(
        { success: false, message: "Cannot review yourself" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      reviewerId: reviewerIdObj
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: "Review already submitted for this session" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await Review.create({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      reviewerId: reviewerIdObj,
      revieweeId: revieweeIdObj,
      rating,
      comment,
      skillId: new mongoose.Types.ObjectId(skillId),
      reviewType,
      isVisible: true
    });

    // Populate the review with user and skill information
    const populatedReview = await Review.findById(review._id)
      .populate('reviewerId', 'firstName lastName avatar')
      .populate('revieweeId', 'firstName lastName avatar')
      .populate('skillId', 'skillTitle')
      .populate('sessionId');

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

// GET - Get reviews (for a user or session)
export async function GET(req: NextRequest) {
  try {
    await connect();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const skillId = searchParams.get('skillId');
    const reviewType = searchParams.get('reviewType');

    let query: any = { isVisible: true };

    if (userId) {
      query.revieweeId = new mongoose.Types.ObjectId(userId);
    }

    if (sessionId) {
      query.sessionId = new mongoose.Types.ObjectId(sessionId);
    }

    if (skillId) {
      query.skillId = new mongoose.Types.ObjectId(skillId);
    }

    if (reviewType && ['skill_teaching', 'skill_learning'].includes(reviewType)) {
      query.reviewType = reviewType;
    }

    const reviews = await Review.find(query)
      .populate('reviewerId', 'firstName lastName avatar')
      .populate('revieweeId', 'firstName lastName avatar')
      .populate('skillId', 'skillTitle categoryName')
      .sort({ createdAt: -1 });

    // Calculate average rating if getting reviews for a specific user
    let averageRating = null;
    if (userId && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }

    return NextResponse.json({
      success: true,
      reviews,
      averageRating,
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

// PUT - Update review visibility (admin function)
export async function PUT(req: NextRequest) {
  try {
    await connect();
    
    const body = await req.json();
    const { reviewId, isVisible } = body;

    if (!reviewId || typeof isVisible !== 'boolean') {
      return NextResponse.json(
        { success: false, message: "Review ID and visibility status are required" },
        { status: 400 }
      );
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isVisible },
      { new: true }
    ).populate('reviewerId', 'firstName lastName')
     .populate('revieweeId', 'firstName lastName');

    if (!review) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Review ${isVisible ? 'made visible' : 'hidden'} successfully`,
      review
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update review visibility error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
