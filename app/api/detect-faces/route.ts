import { createClient } from "@/utils/supabase/server";
import { isWithinInterval } from "date-fns";
import { NextResponse } from "next/server";
import { Client } from "@gradio/client";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { image: string; collection_id: string };
    // const supabase = await createClient();
    // const { data, error: lessonError } = await supabase
    //   .from("lessons")
    //   .select("*")
    //   .eq("id", body.collection_id)
    //   .single<ILesson>();
    // if (lessonError) {
    //   throw new Error("Error fetching lesson");
    // }
    // if (data.photo_request_count! > 2) {
    //   return NextResponse.json(
    //     { message: "Photo request limit exceeded" },
    //     { status: 403 },
    //   );
    // }
    // const currentDate = new Date().toISOString();
    // const lessonDates = data.dates || [];

    // const lessonCurrentlyActive = lessonDates.some((date) => {
    //   return isWithinInterval(currentDate, date);
    // });
    // if (!lessonCurrentlyActive) {
    //   return NextResponse.json(
    //     { message: "Lesson is not active" },
    //     { status: 404 },
    //   );
    // }
    // const {
    //   data: { session },
    //   error,
    // } = await supabase.auth.getSession();
    // if (error) {
    //   throw new Error("Error getting session");
    // }
    // const token = session?.access_token;
    // if (!url || !token) {
    //   throw new Error("No API URL found in environment variables");
    // }
    const gradioClient = await Client.connect("hysts/ibug-face_detection");
    const imageFile = Buffer.from(body.image, "base64");
    const response = await gradioClient.predict("/detect", {
      image: imageFile,
      model_name: "retinaface_mobilenet0.25",
      face_score_threshold: 0.8,
    });
    console.log(response);
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
