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

interface AdminMiddlewareFunction {
  (req: NextRequest): Promise<NextResponse | null>;
}

interface AdminHandlerFunction {
  (req: NextRequest, ...args: any[]): Promise<NextResponse>;
}

// Validate JWT_SECRET early
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required but not set");
}

export async function verifyAdminAuth(
  req: NextRequest
): Promise<AdminUser | null> {
  try {
    // Extract token from HttpOnly cookie instead of Authorization header
    const token = req.cookies.get("adminToken")?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as any;

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

export function createAdminAuthMiddleware(
  requiredPermissions: string[] = []
): AdminMiddlewareFunction {
  return async (req: NextRequest): Promise<NextResponse | null> => {
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

    // Pass admin info via NextResponse.next() with headers instead of mutating req
    const response = NextResponse.next();
    response.headers.set("x-admin-id", admin.id);
    response.headers.set("x-admin-email", admin.email);
    response.headers.set("x-admin-role", admin.role);
    response.headers.set(
      "x-admin-permissions",
      JSON.stringify(admin.permissions)
    );

    return response;
  };
}

// Common admin authentication wrapper
export function withAdminAuth(
  handler: AdminHandlerFunction,
  requiredPermissions: string[] = []
): AdminHandlerFunction {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const authResult =
      await createAdminAuthMiddleware(requiredPermissions)(req);

    if (authResult && authResult.status !== 200) {
      return authResult; // Return auth error response
    }

    return handler(req, ...args);
  };
}

// Helper function to extract admin info from headers in route handlers
export function getAdminFromHeaders(req: NextRequest): AdminUser | null {
  const adminId = req.headers.get("x-admin-id");
  const adminEmail = req.headers.get("x-admin-email");
  const adminRole = req.headers.get("x-admin-role");
  const adminPermissions = req.headers.get("x-admin-permissions");

  if (!adminId || !adminEmail || !adminRole || !adminPermissions) {
    return null;
  }

  try {
    return {
      id: adminId,
      email: adminEmail,
      role: adminRole,
      permissions: JSON.parse(adminPermissions),
    };
  } catch (error) {
    console.error("Error parsing admin permissions from headers:", error);
    return null;
  }
}
