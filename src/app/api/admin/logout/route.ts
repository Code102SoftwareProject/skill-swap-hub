import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // Construct response with cookies set to expire
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Add any custom server-side session invalidation logic here
    // For example, if you're using a database to track valid tokens:
    // await db.invalidateToken(token);

    // Clear cookies by setting them with expiration in the past
    response.cookies.set("admin_token", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    response.cookies.set("admin_session", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    response.cookies.set("adminAuthenticated", "", {
      maxAge: 0,
      path: "/",
      secure: true,
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Error during logout" },
      { status: 500 }
    );
  }
}
