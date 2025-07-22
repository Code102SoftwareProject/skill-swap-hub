import { NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";

/**
 ** POST handler - Uploads a file to Cloudflare R2 storage
 * 
 * @param req FormData containing:
 *            - file: The file to upload (required)
 *            - folder: Optional folder path for organizing files
 * @returns JSON response with upload status
 *          
 */
export async function POST(req: Request) {
  try {
    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || ""; // Get folder parameter

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // Convert File to Buffer directly
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const mimeType = file.type || "application/octet-stream";
    
    // Construct path with folder
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log("Uploading file:", filePath, "Type:", mimeType);

    //  ! Upload to Cloudflare R2 with folder path
    const uploadResponse = await uploadFileToR2(fileBuffer, filePath, mimeType);

    // Set headers to prevent caching
    const headers = new Headers();
    headers.append('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');
    headers.append('Surrogate-Control', 'no-store');
    
    if (uploadResponse.success) {
      return NextResponse.json(
        { message: "File uploaded", url: uploadResponse.url },
        { 
          status: 200,
          headers: headers
        }
      );
    } else {
      return NextResponse.json(
        { message: "Upload failed", error: uploadResponse.error },
        { 
          status: 500,
          headers: headers
        }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    
    // Set headers to prevent caching even for errors
    const headers = new Headers();
    headers.append('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');
    headers.append('Surrogate-Control', 'no-store');
    
    return NextResponse.json(
      { 
        message: "Server error", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { 
        status: 500,
        headers: headers
      }
    );
  }
}