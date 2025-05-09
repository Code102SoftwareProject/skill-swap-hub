import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * API route handler that checks if an admin is authenticated
 * Returns authentication status in JSON response
 */
export async function GET() {
  // Retrieve cookies from the request
  const cookieStore = await cookies();
  // Extract the admin authentication token from cookies
  const adminToken = cookieStore.get("admin_token");

  // If no token exists or it's empty, return unauthorized response
  if (!adminToken || !adminToken.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    // Token exists - in a production environment, you would validate the token here
    // (e.g., verify signature, check expiry, validate against database)
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    // Log any errors that occur during token validation
    console.error("Token validation error:", error);
    // Return unauthorized response with error details
    return NextResponse.json(
      { authenticated: false, error: "Invalid authentication token" },
      { status: 401 }
    );
  }
}
