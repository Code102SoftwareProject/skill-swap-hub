// src/app/api/report/route.ts
import { NextResponse } from "next/server";
import connect from "@/lib/db";
import ReportInSession from "@/lib/models/reportInSessionSchema";

// GET /api/report
export async function GET(req: Request) {
  try {
    await connect();
    const reports = await ReportInSession.find().lean();
    return NextResponse.json(reports, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching reports", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/report
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connect();
    const newReport = new ReportInSession(body);
    await newReport.save();
    return NextResponse.json(
      { message: "Report created successfully", report: newReport },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error creating report", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/report
export async function PATCH(req: Request) {
  try {
    const { id, ...updateData } = await req.json();
    if (!id) {
      return NextResponse.json(
        { message: "Report ID is required" },
        { status: 400 }
      );
    }

    await connect();
    const updated = await ReportInSession.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { message: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Report updated successfully", report: updated },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error updating report", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/report?id=<reportId>
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { message: "Report ID is required" },
        { status: 400 }
      );
    }

    await connect();
    const deleted = await ReportInSession.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json(
        { message: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Report deleted successfully", report: deleted },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error deleting report", error: error.message },
      { status: 500 }
    );
  }
}
