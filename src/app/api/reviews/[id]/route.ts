// src/app/api/reviews/[id]/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connect from "@/lib/db";
import Review from "@/lib/models/reviewSchema";
import User from "@/lib/models/userSchema";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connect();

    // Fix: Destructure params after awaiting
    const { id: userId } =  params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    // Use ObjectId for revieweeId in filter
    const filter: any = {
      revieweeId: new mongoose.Types.ObjectId(userId),
      isVisible: true,
    };

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // Ensure User model is registered
    if (!mongoose.models.User) {
      mongoose.model("User", User.schema);
    }

    // Query reviews with pagination + populate reviewer info
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "reviewerId",
        select: "firstName lastName avatar",
        model: "User" // Explicitly specify the model
      });

    // Map reviews to include a 'reviewer' field for frontend compatibility
    const reviewsWithReviewer = reviews.map(r => {
      const reviewer = r.reviewerId
        ? {
            name: `${r.reviewerId.firstName || ''} ${r.reviewerId.lastName || ''}`.trim(),
            avatar: r.reviewerId.avatar || '',
          }
        : { name: 'Unknown User', avatar: '' };
      return {
        ...r.toObject(),
        reviewer,
      };
    });

    // Get aggregate stats for that user's reviews
    const [stats] = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$revieweeId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      reviews: reviewsWithReviewer,
      totalReviews: stats?.totalReviews || 0,
      averageRating: stats?.averageRating
        ? +stats.averageRating.toFixed(2)
        : null,
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}