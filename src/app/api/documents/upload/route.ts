import { NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const buffer = await file.arrayBuffer();
    const fileName = file.name;
    const mimeType = file.type;

    // Upload to R2
    const uploadResponse = await uploadFileToR2(
      Buffer.from(buffer), // Convert ArrayBuffer to Buffer
      fileName,
      mimeType
    );

    if (uploadResponse.success) {
      return NextResponse.json({
        message: "File uploaded successfully",
        url: uploadResponse.url,
      });
    } else {
      return NextResponse.json(
        { message: "Upload failed", error: uploadResponse.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}

// Configure API route to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};