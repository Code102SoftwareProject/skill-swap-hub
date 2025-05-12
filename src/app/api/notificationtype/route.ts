import { NextResponse } from "next/server";
import connect from "@/lib/db";
import NotificationType from "@/lib/models/notificationTypeSchema";

// GET all notification types or a specific one by ID or typeno
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeno = searchParams.get("typeno");

    await connect();
    if (typeno) {
      // Validate typeno is a number
      if (isNaN(parseInt(typeno))) {
        return NextResponse.json(
          { error: "Invalid type number format" },
          { status: 400 }
        );
      }

      // Get notification type by typeno
      const notificationType = await NotificationType.findOne({
        typeno: parseInt(typeno),
      });

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

    // Validate typeno is a valid number
    if (isNaN(Number(typeno))) {
      return NextResponse.json(
        { error: "Type number must be a valid number" },
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
      color: color || "#3B82F6", // Use provided color or default
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

// PUT to update an existing notification type
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeno = searchParams.get("typeno");
    const body = await request.json();
    const { name, color } = body;

    // Validate type number parameter
    if (!typeno) {
      return NextResponse.json(
        { error: "Type number parameter is required" },
        { status: 400 }
      );
    }

    // Validate typeno is a valid number
    if (isNaN(parseInt(typeno))) {
      return NextResponse.json(
        { error: "Invalid type number format" },
        { status: 400 }
      );
    }

    // Validate at least one field to update
    if (!name && !color) {
      return NextResponse.json(
        { error: "At least one field (name or color) is required for update" },
        { status: 400 }
      );
    }

    await connect();

    // Check if notification type exists
    const existingType = await NotificationType.findOne({ typeno: parseInt(typeno) });
    if (!existingType) {
      return NextResponse.json(
        { error: "Notification type not found" },
        { status: 404 }
      );
    }    // Prepare update object
    const updateData: { name?: string; color?: string } = {};
    if (name) updateData.name = name;
    if (color) updateData.color = color;

    // Update notification type
    const updatedType = await NotificationType.findOneAndUpdate(
      { typeno: parseInt(typeno) },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json(updatedType);
  } catch (error) {
    console.error("Error updating notification type:", error);
    return NextResponse.json(
      { error: "Failed to update notification type" },
      { status: 500 }
    );
  }
}

// DELETE to remove a notification type
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeno = searchParams.get("typeno");

    // Validate type number parameter
    if (!typeno) {
      return NextResponse.json(
        { error: "Type number parameter is required" },
        { status: 400 }
      );
    }

    // Validate typeno is a valid number
    if (isNaN(parseInt(typeno))) {
      return NextResponse.json(
        { error: "Invalid type number format" },
        { status: 400 }
      );
    }

    await connect();

    // Check if notification type exists
    const existingType = await NotificationType.findOne({ typeno: parseInt(typeno) });
    if (!existingType) {
      return NextResponse.json(
        { error: "Notification type not found" },
        { status: 404 }
      );
    }

    // Delete notification type
    await NotificationType.findOneAndDelete({ typeno: parseInt(typeno) });

    return NextResponse.json(
      { message: "Notification type deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting notification type:", error);
    return NextResponse.json(
      { error: "Failed to delete notification type" },
      { status: 500 }
    );
  }
}
