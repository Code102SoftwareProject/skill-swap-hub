import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to authenticate system API calls
 * @param req NextRequest object
 * @returns NextResponse or void (allowing the request to proceed)
 */
export async function systemApiAuth(req: NextRequest) {
  // Get the API key from headers
  const apiKey = req.headers.get('x-api-key');
  
  // Check if API key exists and matches
  if (!apiKey || apiKey !== process.env.SYSTEM_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid API key' },
      { status: 401 }
    );
  }
  
  // API key is valid, proceed
  return NextResponse.next();
}

/**
 * Helper function for route handlers to validate system API key
 * @param req NextRequest object
 * @returns Response if unauthorized, undefined if authorized
 */
export function validateSystemApiKey(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  
  if (!apiKey || apiKey !== process.env.SYSTEM_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid API key' },
      { status: 401 }
    );
  }
  
  return undefined; // Auth successful
}