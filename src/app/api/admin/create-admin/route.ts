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
 * @param request - The incoming request
 * @returns Object containing verification result and admin data
 */
async function verifySuperAdmin(request: NextRequest) {
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
 * POST handler for creating new admin accounts
 * Only super admins can create new admin accounts
 */
export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const {
      isValid,
      admin: superAdmin,
      error,
    } = await verifySuperAdmin(request);

    if (!isValid) {
      return NextResponse.json(
        { message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { username, email, password, role = "admin", permissions } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["super_admin", "admin"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Connect to database
    await connect();

    // Check if username or email already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username: username.trim() }, { email: email.trim() }],
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: "Username or email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Define default permissions based on role
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

    // Create new admin
    const newAdmin = new Admin({
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      role,
      permissions: permissions || defaultPermissions,
      createdBy: superAdmin._id,
      status: "active",
    });

    // Save to database
    await newAdmin.save();

    // Return success response (without password)
    const responseData = {
      success: true,
      message: "Admin created successfully",
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
        status: newAdmin.status,
        createdAt: newAdmin.createdAt,
      },
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the admin" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving all admins
 * Only super admins can view all admin accounts
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { isValid, error } = await verifySuperAdmin(request);

    if (!isValid) {
      return NextResponse.json(
        { message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to database
    await connect();

    // Fetch all admins (excluding passwords)
    const admins = await Admin.find({}, "-password")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching admins" },
      { status: 500 }
    );
  }
}
