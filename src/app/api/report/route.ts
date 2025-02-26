import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Report from "@/lib/models/reportSchema";
import { NextRequest } from "next/server";
import { Types } from 'mongoose';

export const GET = async (req: Request) => {
    try {
        await connect();
        const reports = await Report.find();
        return NextResponse.json(reports, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: "Error in fetching Report", error: error.message },
            { status: 500 }
        );
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        await connect();
        const newReport = new Report(body);
        await newReport.save();

        return NextResponse.json({ message: "Report is created", Admin: newReport}, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error in creating Report", error: error.message }, { status: 500 });
    }
};

