import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Admin from "@/lib/models/adminSchema";
import { NextRequest } from "next/server";

export const GET = async (req: Request) => {
    try {
        await connect();
        const admins = await Admin.find();
        return NextResponse.json(admins, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: "Error in fetching admin", error: error.message },
            { status: 500 }
        );
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        await connect();
        const newAdmin = new Admin(body);
        await newAdmin.save();

        return NextResponse.json({ message: "Admin is created", Admin: newAdmin }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error in creating admin", error: error.message }, { status: 500 });
    }
};

