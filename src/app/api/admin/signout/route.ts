import { NextResponse } from "next/server";

// Cookie name constant
const ADMIN_TOKEN_COOKIE = "adminToken";

export async function POST() {
  try {
    // Create a response that will clear the cookie
    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });

    // Clear the token by setting an expired cookie
    response.cookies.set({
      name: ADMIN_TOKEN_COOKIE,
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json(
      { message: "An error occurred during sign out" },
      { status: 500 }
    );
  }
}
