import { NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";
import { File } from "formidable";
import { readFile } from "fs/promises";

// Disable automatic body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }
    const fileBuffer = await readFile(file.filepath);
    const fileName = file.originalFilename || "";
    const mimeType = file.mimetype || "";
    const uploadResponse = await uploadFileToR2(fileBuffer, fileName, mimeType);

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
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
