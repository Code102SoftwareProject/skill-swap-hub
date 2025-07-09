import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connect from "@/lib/db";
import Admin from "@/lib/models/adminSchema";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// Define JWT secret key with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";

/**
 * Verifies if the current user is a super admin
 */
async function verifySuperAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;

    if (!token) {
      return { isValid: false, admin: null, error: "No authentication token" };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || decoded.role !== "super_admin") {
      return { isValid: false, admin: null, error: "Insufficient permissions" };
    }

    await connect();
    const admin = await Admin.findById(decoded.userId);

    if (!admin || admin.role !== "super_admin" || admin.status !== "active") {
      return {
        isValid: false,
        admin: null,
        error: "Invalid super admin account",
      };
    }

    return { isValid: true, admin, error: null };
  } catch (error) {
    return { isValid: false, admin: null, error: "Authentication failed" };
  }
}

/**
 * PUT handler for updating admin accounts
 * Only super admins can update admin accounts
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { isValid, error } = await verifySuperAdmin();

    if (!isValid) {
      return NextResponse.json(
        { message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { adminId, username, email, password, role, permissions, status } =
      body;

    // Validate required fields
    if (!adminId) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connect();

    // Find the admin to update
    const adminToUpdate = await Admin.findById(adminId);

    if (!adminToUpdate) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    // Prevent super admin from demoting themselves
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;
    const currentUser = jwt.verify(token, JWT_SECRET) as any;

    if (currentUser.userId === adminId && role === "admin") {
      return NextResponse.json(
        { message: "Cannot demote your own account" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (username) updateData.username = username.trim();
    if (email) updateData.email = email.trim();
    if (role && ["super_admin", "admin"].includes(role)) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (status && ["active", "inactive", "suspended"].includes(status))
      updateData.status = status;

    // Hash password if provided
    if (password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Update default permissions if role is changed
    if (role && role !== adminToUpdate.role) {
      const defaultPermissions =
        role === "super_admin"
          ? [
              "manage_admins",
              "manage_users",
              "manage_kyc",
              "manage_suggestions",
              "manage_system",
              "manage_verification",
              "manage_reporting",
              "view_dashboard",
            ]
          : [
              "manage_users",
              "manage_kyc",
              "manage_suggestions",
              "manage_verification",
              "view_dashboard",
            ];

      if (!permissions) {
        updateData.permissions = defaultPermissions;
      }
    }

    // Update the admin
    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return NextResponse.json({
      success: true,
      message: "Admin updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Update admin error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the admin" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting admin accounts
 * Only super admins can delete admin accounts
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { isValid, error } = await verifySuperAdmin();

    if (!isValid) {
      return NextResponse.json(
        { message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get admin ID from query parameters
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("id");

    if (!adminId) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connect();

    // Prevent super admin from deleting themselves
    const cookieStore = await cookies();
    const token = cookieStore.get("adminToken")?.value;
    const currentUser = jwt.verify(token, JWT_SECRET) as any;

    if (currentUser.userId === adminId) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Find and delete the admin
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the admin" },
      { status: 500 }
    );
  }
}
