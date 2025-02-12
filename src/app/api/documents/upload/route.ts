import { NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";
import formidable, { IncomingForm } from "formidable";
import { writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";

// Disable automatic body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Promisify Formidable parsing
const parseForm = (req: Request): Promise<{ fields: formidable.Fields; files: formidable.Files }> =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
    });

    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

export async function POST(req: Request) {
  try {
    // Convert Next.js request body to form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // Read the file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const mimeType = file.type;

    // Upload to Cloudflare R2
    const uploadResponse = await uploadFileToR2(fileBuffer, fileName, mimeType);

    if (uploadResponse.success) {
      return NextResponse.json({ message: "File uploaded", url: uploadResponse.url });
    } else {
      return NextResponse.json({ message: "Upload failed", error: uploadResponse.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
