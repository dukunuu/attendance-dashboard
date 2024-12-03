import { notFound } from "next/navigation";
import Image from "next/image";
import { format, parseISO, differenceInDays } from "date-fns";
import { ArrowLeft, CalendarIcon, Clock, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { mn } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LessonsCalendar from "@/components/courses/LessonsCalendar";

async function getCourse(id: string): Promise<ICourse | null> {
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select()
    .eq("id", id)
    .single<ICourse>();

  if (error) {
    console.error(error);
    return null;
  }

  return course;
}

async function getLessons(courseId: number): Promise<ILesson[]> {
  const supabase = await createClient();
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select()
    .eq("course_id", courseId)
    .returns<ILesson[]>();

  if (error) {
    console.error(error);
    return [];
  }

  return lessons;
}
function calculateDateLeft(date: Date): string {
  const now = new Date();
  const diff = differenceInDays(date, now);

  if (diff === 0) {
    return "1 долоо хоног";
  } else if (diff < 0) {
    return "Хичээл дууссан";
  } else {
    return `${diff} хоног үлдлээ`;
  }
}
function calculateDuration(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInDays(end, start) + 1; // +1 to include both start and end days
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  if (weeks === 0) {
    return `${days} хоног`;
  } else if (remainingDays === 0) {
    return `${weeks} долоо хоног`;
  } else {
    return `${weeks * 7 + remainingDays} хоног`;
  }
}

type Props = { params: Promise<{ courseId: string }> };

export default async function CourseDetailsPage({ params }: Props) {
  const { courseId } = await params;
  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }
  const lessons = await getLessons(course!.id);

  const duration = calculateDuration(course.start_date, course.end_date);

  return (
    <div className="flex w-full flex-col">
      <Link
        href="/courses"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Хичээлүүд рүү буцах
      </Link>

      <div className="grid md:grid-cols-3 gap-8 mb-6">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-4">
            {course.name}{" "}
            <Badge>
              <Copy />
            </Badge>
          </h1>
          <div className="flex items-center space-x-4 mb-4">
            <Badge variant="secondary">
              {format(parseISO(course.start_date), "MMM d")} -{" "}
              {format(parseISO(course.end_date), "MMM d, yyyy")}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {duration}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {calculateDateLeft(parseISO(course.end_date))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm text-gray-500 flex items-center">
              <CalendarIcon className="mr-1 h-4 w-4" />
              {format(parseISO(course.created_at!), "yyyy оны MMMын d ", {
                locale: mn,
              })}
              {"-д үүсгэсэн"}
            </span>
          </div>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">
            {course.description}
          </p>
          <div className="bg-gray-100 dark:bg-[#1e1e1e]  p-4 rounded-lg mb-2">
            <h2 className="text-lg font-semibold mb-2">Хичээлийн мэдээлэл</h2>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="font-medium mr-2">Эхлэх огноо:</span>
                {format(parseISO(course.start_date), "MMMын d, yyyy", {
                  locale: mn,
                })}
              </li>
              <li className="flex items-center">
                <span className="font-medium mr-2">Дуусах огноо:</span>
                {format(parseISO(course.end_date), "MMMын d, yyyy", {
                  locale: mn,
                })}
              </li>
              <li className="flex items-center">
                <span className="font-medium mr-2">
                  <Link href={`/courses/${course.id}/students`}>
                    <Button className="p-0 font-medium mr-2" variant={"link"}>
                      Нийт сурагчдын тоо:
                    </Button>
                  </Link>{" "}
                  <b>{course.student_count}</b>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col w-ful>l gap-5">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={course.imageUrl}
              alt={course.name}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <hr />
      <LessonsCalendar lessons={lessons} />
    </div>
  );
}
