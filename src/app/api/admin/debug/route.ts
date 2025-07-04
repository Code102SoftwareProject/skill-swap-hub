import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connect from "@/lib/db";
import Admin from "@/lib/models/adminSchema";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

/**
 * DEBUG endpoint to check database connection and admin data
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connect();

    // Get connection info
    const connectionInfo = {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      db: mongoose.connection.db?.databaseName,
    };

    console.log("Database connection info:", connectionInfo);

    // Count all admins
    const adminCount = await Admin.countDocuments();
    console.log("Total admins found:", adminCount);

    // Find all admins (without passwords)
    const admins = await Admin.find({}, "-password").limit(10);
    console.log("Admins found:", admins);

    // Specifically look for superadmin
    const superAdmin = await Admin.findOne(
      { username: "superadmin" },
      "-password"
    );
    console.log("Super admin found:", superAdmin);

    return NextResponse.json({
      success: true,
      connectionInfo,
      adminCount,
      admins: admins.map((admin) => ({
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      })),
      superAdmin: superAdmin
        ? {
            _id: superAdmin._id,
            username: superAdmin.username,
            email: superAdmin.email,
            role: superAdmin.role,
            status: superAdmin.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
