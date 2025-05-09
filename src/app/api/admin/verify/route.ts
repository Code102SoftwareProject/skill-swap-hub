import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";

/**
 * Admin verification endpoint that validates JWT tokens
 * Used to protect admin routes by checking authorization headers
 */
export async function GET(req: NextRequest) {
  try {
    // Extract the authorization header from the request
    const authHeader = req.headers.get("authorization");

    // Check if authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Extract the JWT token from the authorization header
    const token = authHeader.split(" ")[1];

    // Verify the token's validity
    const isValid = await verifyJWT(token);

    // If token is invalid or expired, return unauthorized response
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Return authenticated response if token is valid
    return NextResponse.json({ message: "Authenticated" }, { status: 200 });
  } catch (error) {
    console.error("Admin verification error:", error);
    return NextResponse.json(
      { message: "Authentication error" },
      { status: 500 }
    );
  }
}
