import {
  HeadObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
  },
} as S3ClientConfig);

async function uploadToS3(fileBuffer: ArrayBuffer, fileName: string) {
  const params = {
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    Key: `${fileName}`,
    Body: fileBuffer,
    ContentType: "image/*",
  } as PutObjectCommandInput;
  try {
    await s3Client.send(new PutObjectCommand(params));
    const downloadUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${fileName}`;
    return downloadUrl;
  } catch (error) {
    throw new Error("Error uploading file to S3: " + error);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("path") as string;
    if (!file) {
      throw new Error("No file found in request");
    }
    console.log(file, fileName);
    const fileBuffer = await file.arrayBuffer();
    const fullFileName = await uploadToS3(fileBuffer, fileName);
    return NextResponse.json({
      message: "File uploaded successfully",
      status: 200,
      imageUrl: fullFileName,
    });
  } catch (error) {
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
