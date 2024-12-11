import AttendanceSpreadsheet from "@/components/lessons/AttendanceSpreadsheet";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ lessonId: string }>;
};

const getLesson = async (lessonId: string) => {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select()
    .eq("id", lessonId)
    .single<ILesson>();
  if (error) {
    console.error(error);
    return null;
  }

  return lesson;
};

const getCourse = async (courseId: number) => {
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .single<{ id: number; name: string }>();
  if (error) {
    console.error(error);
    return null;
  }

  if (!course) {
    return null;
  }

  return course;
};

export default async function LessonPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);
  if (!lesson) {
    notFound();
  }
  const course = await getCourse(lesson.course_id);
  if (!course) {
    notFound();
  }
  return (
    <div>
      <h1 className="mb-4">
        <Link
          href={`/courses/${course.id}`}
          className="hover:underline font-semibold"
        >
          {course.name}
        </Link>
        /{lesson.title}
      </h1>
      <AttendanceSpreadsheet lesson={lesson} />
    </div>
  );
}
