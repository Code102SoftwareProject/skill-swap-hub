import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { s3Client } from '@/lib/r2'; 

// Helper function to convert readable stream to ArrayBuffer
async function streamToArrayBuffer(stream: Readable): Promise<ArrayBuffer> {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).buffer;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // Extract the filename from the URL
    const filename = url.split('/').pop();
    
    if (!filename) {
      throw new Error('Invalid document URL');
    }

    // Get object from R2
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No document body received');
    }

    // Convert the readable stream to ArrayBuffer
    const documentData = await streamToArrayBuffer(response.Body as Readable);

    // Get content type from the response or default to octet-stream
    const contentType = response.ContentType || 'application/octet-stream';

    // Determine if the file should be downloaded or viewed inline
    const isViewable = ['application/pdf', 'image/jpeg', 'image/png'].includes(contentType);
    const disposition = isViewable ? 'inline' : 'attachment';

    return new NextResponse(documentData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error accessing document:', error);
    return NextResponse.json(
      { 
        error: 'Failed to access document', 
        details: (error as Error).message,
        url: request.url 
      },
      { status: 500 }
    );
  }
}