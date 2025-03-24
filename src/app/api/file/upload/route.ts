import { NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";

// Next.js already handles FormData parsing
export async function POST(req: Request) {
  try {
    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // Convert File to Buffer directly
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const mimeType = file.type || "application/octet-stream";

    console.log("Uploading file:", fileName, "Type:", mimeType);

    // Upload to Cloudflare R2
    const uploadResponse = await uploadFileToR2(fileBuffer, fileName, mimeType);

    if (uploadResponse.success) {
      return NextResponse.json({ message: "File uploaded", url: uploadResponse.url });
    } else {
      return NextResponse.json({ message: "Upload failed", error: uploadResponse.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      message: "Server error", 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}