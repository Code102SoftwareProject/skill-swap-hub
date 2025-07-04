import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * Verifies the validity of a JWT token and returns decoded data
 * @param token - The JWT token to verify
 * @returns Promise<{isValid: boolean, decoded?: any}> - Object containing validity and decoded data
 */
async function verifyJWT(
  token: string
): Promise<{ isValid: boolean; decoded?: any }> {
  try {
    // Get the secret key from environment variables or use fallback
    const secret = process.env.JWT_SECRET || "your-fallback-secret-key";
    // Verify the token using the secret key and get decoded data
    const decoded = jwt.verify(token, secret);
    return { isValid: true, decoded };
  } catch (error) {
    // Return false if token verification fails
    return { isValid: false };
  }
}

/**
 * API endpoint to verify admin authentication status
 * Checks if a valid admin token exists in cookies and returns admin data
 * @param _request - Incoming Next.js request object
 * @returns JSON response with authentication status and admin data
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

    // Verify the token's validity and get decoded data
    const { isValid, decoded } = await verifyJWT(token);

    // Return unauthorized if token is invalid
    if (!isValid) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Return successful authentication response with admin data
    return NextResponse.json({
      authenticated: true,
      admin: {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      },
    });
  } catch (error) {
    // Return unauthorized on any errors during verification
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
