import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Since we're using localStorage for JWT token storage,
    // the actual removal of the token happens on the client side
    // using the AuthContext's logout function
    
    // This endpoint mainly serves as a formality and could be used
    // for additional server-side logout operations if needed:
    // - Logging the logout event
    // - Invalidating the token in a blacklist (if implemented)
    // - Handling any session cleanup on the server
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}