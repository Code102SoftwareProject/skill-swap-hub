import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const uploadFileToR2 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; message: string; url?: string; error?: any }> => {
  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    return {
      success: true,
      message: "File uploaded successfully",
      url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${fileName}`,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false, message: "Upload failed", error };
  }
};
