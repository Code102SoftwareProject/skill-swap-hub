import { NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";
<<<<<<< HEAD:src/app/api/upload/route.ts
import { File } from "formidable";
import { readFile } from "fs/promises";
=======
import formidable, { IncomingForm } from "formidable";
import { writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";
>>>>>>> 2d81585638fec69b0128dddcb8f22b7eb50ff19c:src/app/api/documents/upload/route.ts

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
