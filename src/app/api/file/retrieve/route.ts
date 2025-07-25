import { NextResponse, NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/r2";

/**
 * Optimize image buffer based on size parameter
 */
async function optimizeImage(buffer: Buffer, size: string, contentType?: string): Promise<Buffer> {
  // Simple optimization - in production, you might want to use a proper image processing library
  // like sharp, but for now we'll implement basic size constraints
  
  const sizeMap = {
    'small': { maxWidth: 64, maxHeight: 64, quality: 80 },
    'medium': { maxWidth: 128, maxHeight: 128, quality: 85 },
    'large': { maxWidth: 256, maxHeight: 256, quality: 90 }
  };

  const config = sizeMap[size as keyof typeof sizeMap];
  if (!config) {
    return buffer; // Return original if size not recognized
  }

  // For now, return original buffer
  // In production, implement actual image resizing here
  // You can use libraries like sharp or canvas for server-side image processing
  
  // Ensure we return a proper Buffer
  return Buffer.from(buffer);
}


/**
 ** GET handler - Retrieves a file from Cloudflare R2 storage
 * 
 * @param req Request with one of the following query parameters:
 *            - file: Direct filename to retrieve
 *            - fileUrl: URL of the file to extract filename from
 *            - fileContent: String in format "File:filename.ext:url"

 * @returns Binary file data with appropriate headers on success
 *         
 */
export async function GET(req: NextRequest) {

  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");
    const fileUrl = searchParams.get("fileUrl");
    const fileContent = searchParams.get("fileContent");
    const size = searchParams.get("size"); // New parameter for image optimization
    
    console.log("File download request:", { fileName, fileUrl, fileContent, size });
    
    // Determine the filename to retrieve
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
            const extractedFileName = afterFirstColon.substring(0, secondColonIndex).trim();
            
            // Check if this is from a chat message (contains URL with chat/ path)
            const urlPart = afterFirstColon.substring(secondColonIndex + 1);
            
            // If the URL contains /chat/ directory, assume we need the chat/ prefix
            if (urlPart && urlPart.includes('/chat/')) {
              key = `chat/${extractedFileName}`;
              console.log("Detected chat file, using path:", key);
            } else {
              // Otherwise use the filename as-is (for backward compatibility)
              key = extractedFileName;
              console.log("Using extracted filename:", key);
            }
          }
        }
      } catch (error) {
        console.error("Error parsing file content format:", error);
      }
    } else if (fileUrl) {
      try {
        // Format: "https://example.com/path/to/file.ext"
        if (fileUrl.includes('r2.cloudflarestorage.com')) {
          const bucketName = process.env.R2_BUCKET_NAME || "skillswaphub";
          const bucketIndex = fileUrl.indexOf(bucketName);
          
          if (bucketIndex !== -1) {
            // Get everything after the bucket name and decode it
            const afterBucket = fileUrl.substring(bucketIndex + bucketName.length + 1); // +1 for the slash
            key = decodeURIComponent(afterBucket);
            console.log("Extracted full path from R2 URL:", key);
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

    // Try with the key as provided
    let command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "skillswaphub",
      Key: key,
    });

    try {
      console.log("Sending GetObjectCommand to R2");
      let response;
      try {
        response = await s3Client.send(command);
      } catch (error) {
        // If error and the key doesn't already have "chat/" prefix, try with it
        if (!key.startsWith("chat/") && fileContent?.includes("File:")) {
          const altKey = `chat/${key}`;
          console.log("File not found, trying with chat/ prefix:", altKey);
          command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || "skillswaphub",
            Key: altKey,
          });
          response = await s3Client.send(command);
          key = altKey; // Update key for later use
        } else {
          // No Way Home
          throw error;
        }
      }
      
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
      const buffer = Buffer.from(arrayBuffer.buffer || arrayBuffer);
      
      console.log("File size:", buffer.length, "bytes");
      
      // Extract just the filename without the folder path for the Content-Disposition header
      const filenameForHeader = key.includes('/') ? key.split('/').pop() : key;
      
      // Check if this is an image file
      const isImage = response.ContentType?.startsWith('image/') || 
                     key.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
      
      // Process image optimization if requested
      let finalBuffer = buffer;
      if (isImage && size && size !== 'original') {
        try {
          finalBuffer = await optimizeImage(buffer, size, response.ContentType);
        } catch (optimizeError) {
          console.warn('Image optimization failed, serving original:', optimizeError);
          // Continue with original buffer if optimization fails
        }
      }
      
      // Return the file with appropriate headers
      const headers: Record<string, string> = {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Length": finalBuffer.length.toString(),
      };

      // For images, set inline disposition so they display in browser
      // For other files, force download
      if (isImage) {
        headers["Content-Disposition"] = `inline; filename="${encodeURIComponent(filenameForHeader || key)}"`;
        headers["Cache-Control"] = "public, max-age=3600"; // Cache images for 1 hour
      } else {
        headers["Content-Disposition"] = `attachment; filename="${encodeURIComponent(filenameForHeader || key)}"`;
      }
      
      return new NextResponse(finalBuffer, { headers });
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
