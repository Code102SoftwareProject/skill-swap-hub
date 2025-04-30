import { NextRequest, NextResponse } from "next/server";
import { SystemSettingsModel } from "@/lib/models/systemSettings";
import connect from "@/lib/db";

export async function maintenanceMiddleware(request: NextRequest) {
  // Skip API routes and admin paths
  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/admin")
  ) {
    return NextResponse.next();
  }

  try {
    await connect();
    const settings = await SystemSettingsModel.findOne();

    // If maintenance mode is enabled and the until date hasn't passed
    if (settings && settings.maintenanceMode) {
      const untilDate = settings.until ? new Date(settings.until) : null;
      const now = new Date();

      if (!untilDate || untilDate > now) {
        // Return the maintenance page
        return NextResponse.rewrite(new URL("/maintenance", request.url));
      }

      // If the until date has passed, disable maintenance mode
      if (untilDate && untilDate <= now) {
        settings.maintenanceMode = false;
        await settings.save();
      }
    }
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
  }

  return NextResponse.next();
}
