import { NextRequest, NextResponse } from "next/server";
import  connect  from "@/lib/db";
import  User  from "@/lib/modals/user";

// ✅ GET: Fetch all users
export async function GET() {
  await connect();
  const users = await User.find({});
  return NextResponse.json(users);
}


// ✅ DELETE: Remove a user by ID
export async function DELETE(req: NextRequest) {
  await connect();
  const { id } = await req.json();
  
  await User.findByIdAndDelete(id);
  return NextResponse.json({ message: "User deleted" });
}
