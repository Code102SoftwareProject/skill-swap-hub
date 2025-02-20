import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Admin from "@/lib/modals/adminSchema";
import { NextRequest } from "next/server";
import {Types} from 'mongoose';

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

export const PATCH = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { adminId, newAdmin } = body;

        if (!adminId || !newAdmin) {
            return NextResponse.json({ message: "Admin ID or new Admin is not found" }, { status: 400 });
        }

if(!Types.ObjectId.isValid(adminId)) {
            return NextResponse.json({ message: "Invalid Admin ID" }, { status: 400 });
        }

        await connect();
        const updatedAdmin = await Admin.findByIdAndUpdate(adminId, newAdmin, { new: true });

        return NextResponse.json({ message: "Admin updated successfully", Admin: updatedAdmin }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error in updating admin", error: error.message }, { status: 500 });
    }
}
