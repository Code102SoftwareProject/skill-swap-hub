import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connect from "@/lib/db";
import Admin from "@/lib/models/adminSchema";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export async function verifyAdminAuth(
  req: NextRequest
): Promise<AdminUser | null> {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    await connect();
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return null;
    }

    return {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };
  } catch (error) {
    console.error("Admin auth verification error:", error);
    return null;
  }
}

export function createAdminAuthMiddleware(requiredPermissions: string[] = []) {
  return async (req: NextRequest) => {
    const admin = await verifyAdminAuth(req);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin authentication required" },
        { status: 401 }
      );
    }

    // Check if admin has required permissions
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(
        (permission) =>
          admin.permissions.includes(permission) || admin.role === "super_admin"
      );

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    // Add admin info to request for use in handlers
    (req as any).admin = admin;

    return null; // Continue to handler
  };
}

// Common admin authentication wrapper
export function withAdminAuth(
  handler: Function,
  requiredPermissions: string[] = []
) {
  return async (req: NextRequest, ...args: any[]) => {
    const authResult =
      await createAdminAuthMiddleware(requiredPermissions)(req);

    if (authResult) {
      return authResult; // Return auth error response
    }

    return handler(req, ...args);
  };
}
