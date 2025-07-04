import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    console.log("=== AUTH DEBUG ===");

    // Check if JWT_SECRET exists
    const jwtSecret = process.env.JWT_SECRET;
    console.log("JWT_SECRET exists:", !!jwtSecret);
    console.log("JWT_SECRET length:", jwtSecret?.length || 0);

    // Check authorization header
    const authHeader = req.headers.get("authorization");
    console.log("Auth header exists:", !!authHeader);
    console.log("Auth header format:", authHeader?.substring(0, 20) + "...");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({
        success: false,
        message: "No valid authorization header",
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderFormat: authHeader?.substring(0, 20) || "none",
        },
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token extracted:", token.substring(0, 20) + "...");

    if (!jwtSecret) {
      return NextResponse.json({
        success: false,
        message: "JWT_SECRET not configured",
        debug: {
          hasJwtSecret: false,
        },
      });
    }

    // Try to verify token
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log("Token decoded successfully:", decoded.userId);

    return NextResponse.json({
      success: true,
      message: "Authentication working",
      debug: {
        userId: decoded.userId,
        email: decoded.email,
        tokenValid: true,
      },
    });
  } catch (error: any) {
    console.error("Auth debug error:", error);
    return NextResponse.json({
      success: false,
      message: "Authentication failed",
      error: error.message,
      debug: {
        errorType: error.name,
        errorMessage: error.message,
      },
    });
  }
}
