import StudentsDataTable from "@/components/students/StudentsDataTable";
import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .returns<IStudent[]>();

  return (
    <div className="flex flex-col flex-1 w-full justify-center items-center">
      <h1 className="text-xl font-bold mb-5">Сурагчид</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <StudentsDataTable data={students || []} />
      </Suspense>
    </div>
  );
}
