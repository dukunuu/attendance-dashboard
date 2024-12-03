import StudentsDataTable from "@/components/students/StudentsDataTable";
import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";

export default async function StudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!user) {
    throw new Error("User not found");
  }
  const { data: profile } = await supabase
    .from("users")
    .select()
    .eq("id", user!.id)
    .single<User>();

  return (
    <div className="flex flex-col flex-1 w-full justify-center items-center">
      <h1 className="text-xl font-bold mb-5">Сурагчид</h1>
      <div className="flex w-full flex-col">
        <Suspense fallback={<div>Loading...</div>}>
          <StudentsDataTable profile={profile!} />
        </Suspense>
      </div>
    </div>
  );
}
