import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// Server-side utility to check admin authentication
export async function getServerAdminAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;

    if (!token) {
      return { isAuthenticated: false, admin: null };
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set");
      return { isAuthenticated: false, admin: null };
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    return {
      isAuthenticated: true,
      admin: {
        userId: payload.userId as string,
        username: payload.username as string,
        role: payload.role as string,
        permissions: payload.permissions as string[],
      },
    };
  } catch (error) {
    // Token is invalid or expired
    console.log("Server admin auth check failed:", error);
    return { isAuthenticated: false, admin: null };
  }
}
