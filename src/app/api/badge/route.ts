import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Badge from "@/lib/models/badgeSchema";
import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { adminAuth } from "@/lib/middleware/adminAuth";

/**
 * Interface for badge input validation
 */
interface BadgeInput {
  badgeName: string;
  badgeImage: string;
  criteria: string;
  description: string;
}

/**
 * Interface for badge update validation with optional fields
 */
interface BadgeUpdateInput {
  badgeId: string;
  badgeName?: string;
  badgeImage?: string;
  criteria?: string;
  description?: string;
}

/**
 * Helper function to validate badge ID
 * @param badgeId - The badge ID to validate
 * @returns NextResponse with error or null if valid
 */
function validateBadgeId(badgeId: string | null): NextResponse | null {
  // Check if badgeId is provided
  if (!badgeId) {
    return NextResponse.json(
      { message: "BadgeId is not found" },
      { status: 400 }
    );
  }

  // Validate badgeId format
  if (!Types.ObjectId.isValid(badgeId)) {
    return NextResponse.json({ message: "Invalid BadgeId" }, { status: 400 });
  }

  // If validation passed, return null (no error)
  return null;
}

/**
 * GET endpoint to retrieve all badges
 */
export const GET = async (req: Request) => {
  try {
    // Connect to database
    await connect();
    // Fetch all badges from collection
    const badges = await Badge.find();
    // Return badges as JSON response
    return NextResponse.json(badges, { status: 200 });
  } catch (error: any) {
    // Return error if fetch operation fails
    return NextResponse.json(
      { message: "Error in fetching Badge", error: error.message },
      { status: 500 }
    );
  }
};

/**
 * POST endpoint to create a new badge with admin authentication
 */
export const POST = async (req: NextRequest) => {
  // Authenticate admin first
  const authResponse = await adminAuth(req);
  if (authResponse instanceof NextResponse) {
    return authResponse; // Return auth error if not authenticated
  }

  try {
    // Parse request body for badge data
    const body: BadgeInput = await req.json();
    // Connect to database
    await connect();
    // Create new badge document
    const newBadge = new Badge(body);
    // Save badge to database
    await newBadge.save();

    // Return success response with created badge
    return NextResponse.json(
      { message: "Badge is created", badge: newBadge },
      { status: 200 }
    );
  } catch (error: any) {
    // Return error if creation fails
    return NextResponse.json(
      { message: "Error in creating Badge", error: error.message },
      { status: 500 }
    );
  }
};

/**
 * PATCH endpoint to update an existing badge with admin authentication
 */
export const PATCH = async (req: NextRequest) => {
  // Authenticate admin first
  const authResponse = await adminAuth(req);
  if (authResponse instanceof NextResponse) {
    return authResponse; // Return auth error if not authenticated
  }

  try {
    // Parse request body for badge update data
    const body: BadgeUpdateInput = await req.json();
    const { badgeId, badgeName, badgeImage, criteria, description } = body;

    // Validate badgeId
    const validationError = validateBadgeId(badgeId);
    if (validationError) return validationError;

    // Check for fields to update
    const updateData: Partial<BadgeInput> = {};

    if (badgeName) {
      updateData.badgeName = badgeName;
    }

    if (badgeImage) {
      updateData.badgeImage = badgeImage;
    }

    if (criteria) {
      updateData.criteria = criteria;
    }

    if (description) {
      updateData.description = description;
    }

    // Validate that at least one field was provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields provided for update" },
        { status: 400 }
      );
    }

    // Connect to database
    await connect();
    // Update badge with provided fields
    const updatedBadge = await Badge.findByIdAndUpdate(
      badgeId,
      updateData,
      { new: true } // Return updated document
    );

    // Check if badge exists
    if (!updatedBadge) {
      return NextResponse.json({ message: "Badge not found" }, { status: 404 });
    }

    // Return success response with updated badge
    return NextResponse.json(
      {
        message: "Badge updated successfully",
        badge: updatedBadge,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Return error if update fails
    return NextResponse.json(
      {
        message: "Error in updating Badge",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

/**
 * DELETE endpoint to remove a badge with admin authentication
 */
export const DELETE = async (req: NextRequest) => {
  // Authenticate admin first
  const authResponse = await adminAuth(req);
  if (authResponse instanceof NextResponse) {
    return authResponse; // Return auth error if not authenticated
  }

  try {
    // Extract badgeId from URL query parameters
    const { searchParams } = new URL(req.url);
    const badgeId = searchParams.get("badgeId");

    // Validate badgeId
    const validationError = validateBadgeId(badgeId);
    if (validationError) return validationError;

    // Connect to database
    await connect();
    // Find and delete the badge
    const deletedBadge = await Badge.findByIdAndDelete(
      new Types.ObjectId(badgeId as string)
    );

    // Check if badge exists
    if (!deletedBadge) {
      return NextResponse.json(
        { message: "Badge not found in the database" },
        { status: 404 }
      );
    }

    // Return success response with deleted badge
    return NextResponse.json(
      { message: "Badge deleted successfully", Badge: deletedBadge },
      { status: 200 }
    );
  } catch (error: any) {
    // Return error if deletion fails
    return NextResponse.json(
      { message: "Error in deleting Badge", error: error.message },
      { status: 500 }
    );
  }
};

/**
 * Example of calling protected badge endpoint
 * @param badgeData - The badge data to create
 */
export async function createBadge(badgeData: BadgeInput) {
  try {
    // Get admin token from wherever you store it (localStorage, cookies, etc.)
    const adminToken = localStorage.getItem("adminToken");

    const response = await fetch("/api/badge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`, // Include the token
      },
      body: JSON.stringify(badgeData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create badge");
    }

    return data;
  } catch (error) {
    console.error("Error creating badge:", error);
    throw error;
  }
}

/**
 * Function to handle admin login
 * @param email - Admin email
 * @param password - Admin password
 * @returns Response data or throws error
 */
async function adminLogin(email: string, password: string) {
  try {
    const response = await fetch("/api/admin/login", {
      // Updated path
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Save token for future requests
    localStorage.setItem("adminToken", data.token);

    return data;
  } catch (error) {
    console.error("Admin login error:", error);
    throw error;
  }
}
