import CourseDataTable from "@/components/courses/CourseDataTable";
import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .returns<ICourse[]>();

  return (
    <div className="flex flex-col flex-1 w-full justify-center items-center">
      <h1 className="text-xl font-bold mb-5">Миний хичээлүүд</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <CourseDataTable initialData={courses!} />
      </Suspense>
    </div>
  );
}
