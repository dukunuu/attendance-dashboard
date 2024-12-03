import CourseStudentsTable from "@/components/courses/CourseStudentsTable";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseStudentsPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select()
    .eq("id", user!.id)
    .single<User>();
  if (profileError) {
    throw profileError;
  }
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("name")
    .eq("id", Number.parseInt(courseId))
    .single<{ name: string }>();
  if (courseError) {
    throw courseError;
  }
  return (
    <div className="flex flex-col w-full">
      <h1 className="text-lg font-bold mb-5">
        <Link href={`/courses/${courseId}`} className="hover:underline">
          {course.name}
        </Link>
        /Сурагчид
      </h1>
      <Suspense fallback={<div>Loading...</div>}>
        <CourseStudentsTable profile={profile} courseId={courseId} />
      </Suspense>
    </div>
  );
}
