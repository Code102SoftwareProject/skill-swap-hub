import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Session from "@/lib/models/sessionSchema";

export async function POST(req: Request) {
    try {
        await connect();
        const body = await req.json();
        
        // Input validation
        const requiredFields = ['user1Id', 'skill1Id', 'user2Id', 'skill2Id', 'startDate', 'dueDate'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate dates
        const startDate = new Date(body.startDate);
        const dueDate = new Date(body.dueDate);
        if (dueDate < startDate) {
            return NextResponse.json(
                { error: "Due date cannot be before start date" },
                { status: 400 }
            );
        }

        const session = new Session({
            user1Id: body.user1Id,
            skill1Id: body.skill1Id,
            descriptionOfService1: body.descriptionOfService1 || "",
            descriptionOfService2: body.descriptionOfService2 || "",
            user2Id: body.user2Id,
            skill2Id: body.skill2Id,
            startDate,
            dueDate,
            isAccepted: body.isAccepted || false,
            isAmmended: body.isAmmended || false,
            status: body.status || null
        });

        const savedSession = await session.save();
        
        return NextResponse.json({
            success: true,
            message: "Session created successfully",
            data: savedSession
        }, { status: 201 });

    } catch (error) {
        console.error("Session creation error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to create session",
            error: (error instanceof Error) ? error.message : "Unknown error"
        }, { status: 500 });
    }
}