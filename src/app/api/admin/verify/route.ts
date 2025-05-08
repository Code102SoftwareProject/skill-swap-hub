import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

export async function GET(req: NextRequest) {
  try {
    // Get the admin token from cookies
    const adminToken = req.cookies.get("adminToken")?.value;

    if (!adminToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (!ADMIN_JWT_SECRET) {
      throw new Error("ADMIN_JWT_SECRET is not defined");
    }

    // Verify the token
    try {
      const decoded = jwt.verify(adminToken, ADMIN_JWT_SECRET);

      // Check if token has admin role
      if (!decoded || (decoded as any).role !== "admin") {
        return NextResponse.json({ authenticated: false }, { status: 403 });
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          username: (decoded as any).username,
          role: (decoded as any).role,
        },
      });
    } catch (error) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
