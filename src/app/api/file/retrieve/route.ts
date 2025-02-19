import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const bucketUrl = searchParams.get("bucketUrl");
    const fileName = searchParams.get("file");

    if (!bucketUrl || !fileName) {
      return NextResponse.json(
        { message: "Missing required parameters: bucketUrl or file" },
        { status: 400 }
      );
    }

    // Construct file URL in Cloudflare R2
    const fileUrl = `${bucketUrl}/${fileName}`;

    // Fetch the file from Cloudflare R2
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      return NextResponse.json(
        { message: "File not found", error: fileResponse.statusText },
        { status: 404 }
      );
    }

    // Stream file response
    return new NextResponse(fileResponse.body, {
      headers: {
        "Content-Type":
          fileResponse.headers.get("Content-Type") || "application/octet-stream",
        "Content-Length": fileResponse.headers.get("Content-Length") || "",
      },
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json(
      { message: "Server error", error: error },
      { status: 500 }
    );
  }
}
