import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';

// Mongo schema
const KYCModel = mongoose.models.KYC || mongoose.model(
  'KYC',
  new mongoose.Schema({
    nic: String,
    frontURL: String,
    backURL: String,
  })
);

// R2 config (same as S3)
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY as string,
    secretAccessKey: process.env.R2_SECRET_KEY as string,
  }
});

async function uploadToR2(file: File, prefix: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop();
  const key = `${prefix}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });

  await s3.send(command);
  return `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;
}

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const nic = formData.get('nic') as string;
    const nicFront = formData.get('nicFront') as File;
    const nicBack = formData.get('nicBack') as File;

    if (!nic || !nicFront || !nicBack) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const [frontURL, backURL] = await Promise.all([
      uploadToR2(nicFront, 'nic_front'),
      uploadToR2(nicBack, 'nic_back'),
    ]);

    await connectDB();
    const record = await KYCModel.create({ nic, frontURL, backURL });

    return NextResponse.json(record);
  } catch (err) {
    console.error('Error uploading:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
