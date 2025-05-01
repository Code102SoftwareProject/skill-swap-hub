import { NextRequest, NextResponse } from 'next/server';

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