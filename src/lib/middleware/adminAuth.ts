import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function adminAuth(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      );
    }

    if (!process.env.ADMIN_JWT_SECRET) {
      throw new Error("ADMIN_JWT_SECRET is not defined");
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

      // Check if token has admin role
      if (!decoded || (decoded as any).role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Not authorized as admin" },
          { status: 403 }
        );
      }

      // Add admin to request for downstream handlers
      (req as any).admin = decoded;

      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
