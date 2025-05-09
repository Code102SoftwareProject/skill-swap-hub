import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * Verifies the validity of a JWT token
 * @param token - The JWT token to verify
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
async function verifyJWT(token: string): Promise<boolean> {
  try {
    // Get the secret key from environment variables or use fallback
    const secret = process.env.JWT_SECRET || "your-fallback-secret-key";
    // Verify the token using the secret key
    jwt.verify(token, secret);
    return true;
  } catch (error) {
    // Return false if token verification fails
    return false;
  }
}

/**
 * API endpoint to verify admin authentication status
 * Checks if a valid admin token exists in cookies
 * @param _request - Incoming Next.js request object
 * @returns JSON response with authentication status
 */
export async function GET(_request: NextRequest) {
  try {
    // Access the cookie store
    const cookieStore = await cookies();
    // Get the admin token from cookies if it exists
    const token = cookieStore.get("adminToken")?.value;

    // Return unauthorized if no token is found
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify the token's validity
    const isValid = await verifyJWT(token);

    // Return unauthorized if token is invalid
    if (!isValid) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Return successful authentication response
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    // Return unauthorized on any errors during verification
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
