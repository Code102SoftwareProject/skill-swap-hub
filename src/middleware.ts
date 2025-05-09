import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that require admin authentication
const protectedRoutes = ["/admin/dashboard", "/admin/users", "/admin/skills"];

/**
 * Middleware function to protect admin routes
 * Verifies admin authentication before allowing access to protected routes
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the requested path is a protected admin route
  if (
    protectedRoutes.some((route) => path.startsWith(route)) ||
    path === "/admin"
  ) {
    // Extract admin authentication token from cookies
    const token = request.cookies.get("adminToken")?.value;

    // Redirect to login if no token exists
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      // Get JWT secret from environment variables
      const jwtSecret = process.env.JWT_SECRET;

      // Ensure JWT secret exists in production environment
      if (!jwtSecret && process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET is not defined in production environment");
      }

      // Create secret key for JWT verification
      const secret = new TextEncoder().encode(
        jwtSecret ||
          (process.env.NODE_ENV !== "production"
            ? "dev-fallback-secret-key"
            : "")
      );

      // Verify JWT token using the secret
      await jwtVerify(token, secret);

      // Allow request to proceed if token is valid
      return NextResponse.next();
    } catch (error) {
      // Handle token verification failure
      console.error("Token verification failed:", error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Allow non-protected routes to proceed
  return NextResponse.next();
}

// Configure middleware to run only on admin routes
export const config = {
  matcher: ["/admin/:path*"],
};
