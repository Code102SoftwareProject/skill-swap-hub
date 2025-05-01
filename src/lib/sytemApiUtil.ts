import { NextResponse ,NextRequest } from "next/server";
export async function requireSystemApiKey(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  
  if (!apiKey) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: 'API key required for this operation' },
        { status: 401 }
      )
    };
  }
}