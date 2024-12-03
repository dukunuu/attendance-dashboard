import { createClient } from "@/utils/supabase/server";
import { isWithinInterval } from "date-fns";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { image: string; collection_id: string };
    const url = process.env.NEXT_PUBLIC_DETECT_API_URL;
    const supabase = await createClient();
    const { data, error: lessonError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", Number.parseInt(body.collection_id))
      .single<ILesson>();
    if (lessonError) {
      throw new Error("Error fetching lesson");
    }
    if (data.photo_request_count! > 2) {
      return NextResponse.json(
        { message: "Photo request limit exceeded" },
        { status: 403 },
      );
    }
    const currentDate = new Date().toISOString();
    const lessonDates = data.dates || [];

    const lessonCurrentlyActive = lessonDates.some((date) => {
      return isWithinInterval(currentDate, date);
    });
    if (!lessonCurrentlyActive) {
      return NextResponse.json(
        { message: "Lesson is not active" },
        { status: 404 },
      );
    }
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      throw new Error("Error getting session");
    }
    const token = session?.access_token;
    if (!url || !token) {
      throw new Error("No API URL found in environment variables");
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("Error fetching from API");
    }
    const json = (await response.json()) as {
      message: string;
      s3_key: string;
      matched_faces: { external_image_id: string; similarity: number }[];
    };
    const { matched_faces } = json;
    if (matched_faces.length === 0) {
      return NextResponse.json({ message: "No faces detected" });
    }
    const studentIds = matched_faces
      .map((face) => face.external_image_id)
      .filter((id) => id !== "Unknown");
    if (studentIds.length === 0) {
      return NextResponse.json(
        { message: "No students found" },
        { status: 404 },
      );
    }
    const { error: rpcError } = await supabase.rpc(
      "update_attendance_matched",
      {
        p_student_codes: studentIds,
        p_lesson_id: Number.parseInt(body.collection_id),
      },
    );
    if (rpcError) {
      throw new Error("Error updating attendance");
    }
    return NextResponse.json(
      { message: "Ирц амжилттай бүртгэгдлээ", studentCodes: studentIds },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
