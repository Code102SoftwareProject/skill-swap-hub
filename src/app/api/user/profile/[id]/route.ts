import { NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/userSchema";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connect();
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const user = await User.findById(id).select('firstName lastName email avatar title');

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
