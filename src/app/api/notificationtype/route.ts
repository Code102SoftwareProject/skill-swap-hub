import { NextResponse } from "next/server";
import connect from "@/lib/db";
import NotificationType from "@/lib/models/notificationTypeSchema";

// GET all notification types or a specific one by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    await connect();
    
    if (id) {
      // Get notification type by ID
      const notificationType = await NotificationType.findById(id);
      
      if (!notificationType) {
        return NextResponse.json(
          { error: "Notification type not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(notificationType);
    } else {
      // Get all notification types
      const notificationTypes = await NotificationType.find({});
      return NextResponse.json(notificationTypes);
    }
  } catch (error) {
    console.error("Error fetching notification types:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification types" },
      { status: 500 }
    );
  }
}

// POST to create a new notification type
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { typeno, name, color } = body;
    
    // Validate required fields
    if (!typeno || !name) {
      return NextResponse.json(
        { error: "Type number and name are required" },
        { status: 400 }
      );
    }
    
    await connect();
    
    // Check if typeno already exists
    const existingType = await NotificationType.findOne({ typeno });
    if (existingType) {
      return NextResponse.json(
        { error: "A notification type with this type number already exists" },
        { status: 409 }
      );
    }
    
    // Create new notification type
    const newNotificationType = await NotificationType.create({
      typeno,
      name,
      color: color || "#3B82F6" // Use provided color or default
    });
    
    return NextResponse.json(newNotificationType, { status: 201 });
  } catch (error) {
    console.error("Error creating notification type:", error);
    return NextResponse.json(
      { error: "Failed to create notification type" },
      { status: 500 }
    );
  }
}