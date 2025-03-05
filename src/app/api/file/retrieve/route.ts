import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Create S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(req: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");
    const fileUrl = searchParams.get("fileUrl");
    
    // Determine the key (filename) to retrieve
    let key;
    
    if (fileName) {
      // If a direct filename is provided, use it
      key = fileName;
    } else if (fileUrl) {
      // If a full URL is provided, extract the filename from it
      // This handles URLs like: https://bucket.r2.cloudflarestorage.com/bucket-name/filename.ext
      const urlParts = fileUrl.split('/');
      key = urlParts[urlParts.length - 1];
    } else {
      return NextResponse.json(
        { message: "Missing required parameter: file or fileUrl" },
        { status: 400 }
      );
    }
    
    console.log("Retrieving file with key:", key);

    // Get file from R2 using SDK
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "skillswaphub",
      Key: key,
    });

    try {
      const response = await s3Client.send(command);
      
      if (!response.Body) {
        console.error("File not found in R2:", key);
        return NextResponse.json(
          { message: "File not found" },
          { status: 404 }
        );
      }

      // Convert the response body to a buffer instead of streaming directly
      const arrayBuffer = await response.Body.transformToByteArray();
      const buffer = Buffer.from(arrayBuffer);
      
      // Return the file with appropriate headers
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": response.ContentType || "application/octet-stream",
          "Content-Length": response.ContentLength?.toString() || buffer.length.toString(),
          "Content-Disposition": `inline; filename="${encodeURIComponent(key)}"`,
        },
      });
    } catch (error) {
      console.error("Error retrieving file from R2:", error);
      return NextResponse.json(
        { message: "Error retrieving file", error: JSON.stringify(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Server error", error: JSON.stringify(error) },
      { status: 500 }
    );
  }
}
