import { notFound } from "next/navigation";
import Image from "next/image";
import { format, parseISO, isWithinInterval, isBefore } from "date-fns";
import { ArrowLeft, CalendarIcon, Clock, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { mn } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LessonsCalendar from "@/components/courses/LessonsCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import CourseStudentsTable from "@/components/courses/CourseStudentsTable";
import { getCourse, getLessons, getProfile } from "@/app/actions";

type Props = { params: Promise<{ courseId: string }> };

export default async function CourseDetailsPage({ params }: Props) {
  const { courseId } = await params;
  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }
  const lessons = await getLessons(course!.id);
  const profile = await getProfile();
  if (!profile) {
    notFound();
  }

  const currentLesson = lessons.find((lesson) => {
    return lesson.dates?.some((date) => {
      const now = new Date();
      return isWithinInterval(now.toISOString(), date);
    });
  });

  const nextLesson = lessons.find((lesson) => {
    return lesson.dates?.some((date) => {
      const now = new Date();
      return isBefore(
        now.toISOString(),
        parseISO(date.start as unknown as string),
      );
    });
  });

  return (
    <div className="flex w-full flex-col">
      <Link
        href="/courses"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Хичээлүүд рүү буцах
      </Link>
      <h1 className="text-3xl font-bold mb-4">{course.name}</h1>
      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="info">Хичээлийн мэдээлэл</TabsTrigger>
          <TabsTrigger value="students">Хичээлийн сурагчид</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {format(parseISO(course.start_date), "MMM d")} -{" "}
                  {format(parseISO(course.end_date), "MMM d, yyyy")}
                </Badge>
              </div>
              <p className="text-gray-600 mb-6 whitespace-pre-wrap">
                {course.description}
              </p>
              <div className="bg-gray-100 dark:bg-[#1e1e1e]  p-4 rounded-lg mb-2">
                <h2 className="text-lg font-semibold mb-2">
                  Хичээлийн мэдээлэл
                </h2>
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
                    <span className="font-medium mr-2">Үүсгэсэн огноо:</span>
                    {format(
                      parseISO(course.created_at as unknown as string),
                      "MMMын d, yyyy",
                      {
                        locale: mn,
                      },
                    )}
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
              <div className="flex flex-col gap-2">
                {currentLesson && (
                  <div>
                    <span className="font-semibold animate-pulse">
                      Идэвхитэй цаг:{" "}
                    </span>
                    <Link
                      href={`/lessons/${currentLesson.id}`}
                      className="underline"
                    >
                      {currentLesson.title}
                    </Link>
                  </div>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <span className="font-semibold">Дараагийн цаг: </span>
                        <span>
                          {nextLesson ? (
                            <Link
                              href={`/lessons/${nextLesson.id}`}
                              className="underline"
                            >
                              {nextLesson.title}
                            </Link>
                          ) : (
                            "Байхгүй"
                          )}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {nextLesson ? (
                        <div>
                          <div>
                            <span className="font-semibold">Эхлэх огноо: </span>
                            {format(
                              parseISO(
                                nextLesson.dates![0].start as unknown as string,
                              ),
                              "yyyy-MM-dd",
                            )}
                          </div>
                          <div>
                            <span className="font-semibold">Цаг: </span>
                            {format(
                              parseISO(
                                nextLesson.dates![0].start as unknown as string,
                              ),
                              "HH:mm",
                            )}
                            -
                            {format(
                              parseISO(
                                nextLesson.dates![0].end as unknown as string,
                              ),
                              "HH:mm",
                            )}
                          </div>
                        </div>
                      ) : (
                        "Байхгүй"
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <hr className="mb-4" />
          <LessonsCalendar lessons={lessons} />
        </TabsContent>
        <TabsContent value="students">
          <Suspense fallback={<div>Loading...</div>}>
            <CourseStudentsTable profile={profile} courseId={courseId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
