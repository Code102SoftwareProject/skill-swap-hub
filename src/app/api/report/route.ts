import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Report from "@/lib/models/reportSchema";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

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

    return NextResponse.json(
      { message: "Report is created", Admin: newReport },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in creating Report", error: error.message },
      { status: 500 }
    );
  }
};

export const PATCH = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { reportId, title, description, status, generatedDate } = body;

    if (!reportId) {
      return NextResponse.json(
        { message: "report is not found" },
        { status: 400 }
      );
    }
    if (!title || !description || !status || !generatedDate) {
      return NextResponse.json(
        { message: "Report title or description or status not found" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { message: "Invalid reportId" },
        { status: 400 }
      );
    }

    await connect();
    const updatedAdmin = await Report.findByIdAndUpdate(
      reportId,
      {
        title: title,
        description: description,
        generatedDate: generatedDate,
        status: status,
      },
      { new: true }
    );

    return NextResponse.json(
      { message: "Report updated successfully", Admin: updatedAdmin },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in updating Report", error: error.message },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");
    if (!reportId) {
      return NextResponse.json(
        { message: "ReportId is not found" },
        { status: 400 }
      );
    }
    if (!Types.ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { message: "Invalid ReportId" },
        { status: 400 }
      );
    }

    await connect();
    const deletedReport = await Report.findByIdAndDelete(
      new Types.ObjectId(reportId)
    );

    if (!deletedReport) {
      return NextResponse.json(
        { message: "Report not found in the database" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Report deleted successfully", Report: deletedReport },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in deleting Report", error: error.message },
      { status: 500 }
    );
  }
};
