import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Badge from "@/lib/models/badgeSchema";
import { NextRequest } from "next/server";
import { Types } from 'mongoose';

export const GET = async (req: Request) => {
    try {
        await connect();
        const badges = await Badge.find();
        return NextResponse.json(badges, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: "Error in fetching Badge", error: error.message },
            { status: 500 }
        );
    }
};


export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        await connect();
        const newBadge = new Badge(body);
        await newBadge.save();

        return NextResponse.json({ message: "Badge is created", Admin: newBadge}, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error in creating Badge", error: error.message }, { status: 500 });
    }
};


