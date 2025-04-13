import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/r2";

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
      try {
        // More robust URL parsing
        const url = new URL(fileUrl);
        // Get the pathname and extract the last segment after '/'
        const pathSegments = url.pathname.split('/').filter(Boolean);
        key = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
        
        if (!key) {
          console.error("Could not extract filename from URL:", fileUrl);
          return NextResponse.json(
            { message: "Invalid file URL format" },
            { status: 400 }
          );
        }
      } catch (urlError) {
        console.error("Error parsing file URL:", urlError);
        return NextResponse.json(
          { message: "Invalid file URL format" },
          { status: 400 }
        );
      }
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
          "Content-Disposition": `attachment; filename="${encodeURIComponent(key)}"`,
        },
      });
    } catch (error: any) {
      console.error("Error retrieving file from R2:", error);
      return NextResponse.json(
        { 
          message: "Error retrieving file",
          errorDetails: error.name ? `${error.name}: ${error.message}` : "Unknown error"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { 
        message: "Server error", 
        errorDetails: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
