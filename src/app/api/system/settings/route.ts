import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import { SystemSettingsModel } from "@/lib/models/systemSettings";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "mySuperSecretJWTKey";

// Helper to verify admin token
async function verifyAdminToken(req: NextRequest) {
  try {
    // Get token from cookies or authorization header
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    // Verify the token
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// GET endpoint to fetch current system settings
export async function GET(req: NextRequest) {
  try {
    await connect();

    // Try to find existing settings, create default if none exists
    let settings = await SystemSettingsModel.findOne();

    if (!settings) {
      settings = await SystemSettingsModel.create({
        maintenanceMode: false,
        message:
          "The site is currently under maintenance. Please check back soon.",
        until: null,
      });
    }

    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode,
      message: settings.message,
      until: settings.until,
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update system settings
export async function PATCH(req: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { maintenanceMode, message, until } = await req.json();

    // Find settings or create if not exist
    let settings = await SystemSettingsModel.findOne();

    if (!settings) {
      settings = new SystemSettingsModel();
    }

    // Update settings
    settings.maintenanceMode = maintenanceMode;
    settings.message = message;
    settings.until = until ? new Date(until) : null;

    await settings.save();

    return NextResponse.json({
      success: true,
      settings: {
        maintenanceMode: settings.maintenanceMode,
        message: settings.message,
        until: settings.until,
      },
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    return NextResponse.json(
      { error: "Failed to update system settings" },
      { status: 500 }
    );
  }
}
