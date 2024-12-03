import {
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

export async function POST(req: Request) {
  try {
    const { images, lessonId } = (await req.json()) as {
      images: string[];
      lessonId: string;
    };
    if (!images || images.length === 0 || !lessonId) {
      throw new Error("No file found in request");
    }
    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      Key: `courses/${lessonId}/student_images.json`,
      Body: JSON.stringify(images),
      ContentType: "application/json",
    } as PutObjectCommandInput;
    const uploadCommand = new PutObjectCommand(params);
    await s3Client.send(uploadCommand);
    return NextResponse.json({
      message: "File uploaded successfully",
      status: 200,
      images,
    });
  } catch (error) {
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
