import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Ensure JWT secret exists - fail fast if missing
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Encode the secret once at module load time
const secret = new TextEncoder().encode(jwtSecret);

/**
 * Middleware function to protect admin routes
 * Verifies admin authentication before allowing access to protected routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication check for the login page itself
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Extract admin authentication token from cookies
  const token = request.cookies.get("adminToken")?.value;

  // Redirect to login if no token exists
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    // Verify JWT token using the pre-encoded secret
    await jwtVerify(token, secret);

    // Allow request to proceed if token is valid
    return NextResponse.next();
  } catch (error) {
    // Handle token verification failure
    console.error("Token verification failed:", error);
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

// Configure middleware to run only on admin routes
export const config = {
  matcher: ["/admin/:path*"],
};
