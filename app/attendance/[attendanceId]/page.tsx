import { updateAttendance } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { AttendanceRedirectPage } from "@/components/lessons/AttendanceRedirectPage";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { isBefore } from "date-fns";

type Props = {
  params: Promise<{ attendanceId: string }>;
  searchParams: Promise<Message>;
};

export default async function StudentAttendancePage({
  params,
  searchParams,
}: Props) {
  const { attendanceId } = await params;
  const message = await searchParams;
  const supabase = await createClient();

  const { data: attendance, error } = await supabase
    .from("attendance_qrs")
    .select("id, expiry_date, lessons(id, title, courses(name))")
    .eq("link_id", attendanceId)
    .single<{
      id: number;
      expiry_date: string;
      lessons: Partial<ILesson & { courses: { name: string } }>;
    }>();
  if (error) {
    console.error(error);
    return <AttendanceRedirectPage message="Алдаа гарлаа" severity="error" />;
  }
  if (!isBefore(new Date().toISOString(), attendance.expiry_date)) {
    return (
      <AttendanceRedirectPage
        message="Уучлаарай, хичээлийн ирц бүртгэх одоогоор боломжгүй байна."
        severity="message"
      />
    );
  }
  const submitAction = async (formData: FormData) => {
    "use server";
    const rawData = {
      name: formData.get("first_name")!.toString().toUpperCase(),
      code: formData.get("student_code")!.toString().toUpperCase(),
    };
    if (!rawData.name || !rawData.code) {
      encodedRedirect(
        "error",
        `/attendance/${attendanceId}`,
        "Нэр эсвэл код хоосон байна",
      );
    }
    if (!isBefore(new Date().toISOString(), attendance.expiry_date)) {
      encodedRedirect(
        "error",
        `/attendance/${attendanceId}`,
        "Хичээлийн ирц бүртгэх хугацаа дууссан байна",
      );
    }
    const { data, error } = await updateAttendance(
      attendance.lessons.id!,
      rawData.code,
      rawData.name,
    );
    if (error) {
      console.error(error);
      return encodedRedirect(
        "error",
        `/attendance/${attendanceId}`,
        "Алдаа гарлаа",
      );
    }
    if (!data) {
      return encodedRedirect(
        "error",
        `/attendance/${attendanceId}`,
        "Алдаа гарлаа: Нэр эсвэл код буруу байна",
      );
    }
    encodedRedirect(
      "success",
      `/attendance/${attendanceId}`,
      "Амжилттай бүртгэгдлээ",
    );
  };
  return (
    <div className="flex justify-center flex-col items-center w-full">
      <h1 className="mb-4">{`${attendance.lessons.courses?.name}/${attendance.lessons.title}`}</h1>
      <form
        action={submitAction}
        className="flex flex-col justify-center items-center w-72  gap-2 mb-4"
      >
        <Input
          type="text"
          required
          placeholder="Нэр (Дөлгөөн)"
          name="first_name"
          className="w-full"
        />
        <Input
          type="text"
          required
          placeholder="Оюутны код (B210910004)"
          name="student_code"
          className="w-full"
        />
        <SubmitButton pendingText="..." className="w-full mt-5">
          Бүртгэх
        </SubmitButton>
        <FormMessage message={message} />
      </form>
    </div>
  );
}
