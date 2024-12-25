import { NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/modals/user";

export const GET = async () => {
    try {
        await connect();
        const users = await User.find();
        return new NextResponse(JSON.stringify(users), { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
    }
};