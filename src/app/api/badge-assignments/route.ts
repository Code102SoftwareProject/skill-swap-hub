import { NextResponse } from "next/server";
import { assignAllEligibleBadges } from "./badgeService";

export async function POST(request: Request) {
  try {
    // Optional: Add simple authentication
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const { secret } = await request.json().catch(() => ({}));
      if (secret !== cronSecret) {
        return NextResponse.json({
          success: false,
          message: "Unauthorized"
        }, { status: 401 });
      }
    }
    
    console.log("Badge assignment API called from cron-job.org");
    
    const result = await assignAllEligibleBadges();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Badge assignment completed successfully. Total badges assigned: ${(result as any).totalAssigned || 0}`,
        data: result
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: "Badge assignment failed",
        error: (result as any).error || "Unknown error"
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Error in badge assignment API:", error);
    return NextResponse.json({
      success: false,
      message: "Badge assignment API error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Optional: Allow GET requests for testing
export async function GET() {
  try {
    console.log("Badge assignment API test called");
    
    const result = await assignAllEligibleBadges();
    
    return NextResponse.json({
      success: true,
      message: "Badge assignment test completed",
      data: result
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error in badge assignment API test:", error);
    return NextResponse.json({
      success: false,
      message: "Badge assignment API test error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}