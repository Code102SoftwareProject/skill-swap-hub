import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/r2";

export async function GET(req: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");
    const fileUrl = searchParams.get("fileUrl");
    const fileContent = searchParams.get("fileContent"); // Add this to handle the full content string
    
    console.log("File download request:", { fileName, fileUrl, fileContent });
    
    // Determine the key (filename) to retrieve
    let key;
    
    if (fileName) {
      // If a direct filename is provided, use it
      key = decodeURIComponent(fileName);
    } else if (fileContent && fileContent.startsWith("File:")) {
      // Parse the content string format: "File:filename.ext:url"
      try {
        // Split by first colon to separate "File:" prefix
        const firstColonIndex = fileContent.indexOf(":");
        if (firstColonIndex !== -1) {
          // Find the second colon that separates filename from URL
          const afterFirstColon = fileContent.substring(firstColonIndex + 1);
          const secondColonIndex = afterFirstColon.indexOf(":");
          
          if (secondColonIndex !== -1) {
            // Extract the filename between the two colons
            key = afterFirstColon.substring(0, secondColonIndex).trim();
            console.log("Extracted key from file content:", key);
          }
        }
      } catch (error) {
        console.error("Error parsing file content format:", error);
      }
    } else if (fileUrl) {
      try {
        // For R2 URLs, try to extract the full path after bucket name
        if (fileUrl.includes('r2.cloudflarestorage.com')) {
          // Extract everything after the bucket name
          const bucketName = process.env.R2_BUCKET_NAME || "skillswaphub";
          const bucketIndex = fileUrl.indexOf(bucketName);
          
          if (bucketIndex !== -1) {
            // Get everything after the bucket name and decode it
            const afterBucket = fileUrl.substring(bucketIndex + bucketName.length + 1); // +1 for the slash
            key = decodeURIComponent(afterBucket);
            console.log("Extracted key from R2 URL:", key);
          } else {
            // Fallback to original parsing method
            const url = new URL(fileUrl);
            const pathSegments = url.pathname.split('/').filter(Boolean);
            key = pathSegments.length > 0 ? 
                  decodeURIComponent(pathSegments[pathSegments.length - 1]) : 
                  null;
          }
        } else {
          // Standard URL parsing for non-R2 URLs
          const url = new URL(fileUrl);
          const pathSegments = url.pathname.split('/').filter(Boolean);
          key = pathSegments.length > 0 ? 
                decodeURIComponent(pathSegments[pathSegments.length - 1]) : 
                null;
        }
        
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
          { message: "Invalid file URL format", error: urlError instanceof Error ? urlError.message : String(urlError) },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "Missing required parameter: file, fileUrl, or fileContent" },
        { status: 400 }
      );
    }
    
    if (!key) {
      return NextResponse.json(
        { message: "Could not determine file key/name" },
        { status: 400 }
      );
    }
    
    console.log("Retrieving file with key:", key);
    console.log("Using bucket:", process.env.R2_BUCKET_NAME || "skillswaphub");

    // Get file from R2 using SDK
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "skillswaphub",
      Key: key,
    });

    try {
      console.log("Sending GetObjectCommand to R2");
      const response = await s3Client.send(command);
      
      if (!response.Body) {
        console.error("File not found in R2:", key);
        return NextResponse.json(
          { message: "File not found" },
          { status: 404 }
        );
      }

      console.log("File retrieved successfully, content type:", response.ContentType);
      
      // Convert the response body to a buffer instead of streaming directly
      const arrayBuffer = await response.Body.transformToByteArray();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log("File size:", buffer.length, "bytes");
      
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
          errorDetails: error.name ? `${error.name}: ${error.message}` : "Unknown error",
          key: key,
          bucket: process.env.R2_BUCKET_NAME || "skillswaphub"
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
