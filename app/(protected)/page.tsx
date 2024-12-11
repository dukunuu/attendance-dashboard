import LessonsCalendar from "@/components/courses/LessonsCalendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/server";
import { format, isWithinInterval } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LessonData, transformAttendanceData } from "./helper";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SingleLessonProgressChart from "@/components/progress-chart";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("start_date", { ascending: true })
    .returns<ICourse[]>();

  if (error) {
    return <div>{error.message}</div>;
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons_by_user_view")
    .select("*")
    .returns<ILesson[]>();

  if (lessonsError) {
    return <div>{lessonsError.message}</div>;
  }

  const currentlyActiveLessons = lessons.filter((lesson) =>
    lesson.dates!.some((date) =>
      isWithinInterval(new Date().toISOString(), date),
    ),
  );

  console.log(currentlyActiveLessons);

  const { data: attendanceChartData, error: userCoursesError } = await supabase
    .from("course_attendance_pie_chart")
    .select("*")
    .returns<LessonData[]>();

  if (userCoursesError) {
    return <div>{userCoursesError.message}</div>;
  }

  const transofrmedData = transformAttendanceData(attendanceChartData);
  return (
    <>
      <section className="w-full">
        <Tabs defaultValue="course-charts">
          <TabsList className="w-full">
            <TabsTrigger value="course-charts" className="w-full">
              Хичээлүүд
            </TabsTrigger>
            <TabsTrigger value="lesson-charts" className="w-full">
              Календар
            </TabsTrigger>
          </TabsList>
          <TabsContent value="course-charts" className="w-full">
            <Accordion type="multiple">
              {courses.map((course) => (
                <AccordionItem key={course.id} value={course.name}>
                  <AccordionTrigger className="hover:no-underline text-left">
                    <div className="flex item-center justify-between w-full md:items-center px-2 flex-col md:flex-row">
                      <div className="flex items-center flex-col md:flex-row h-max gap-5">
                        <Image
                          src={course.imageUrl}
                          alt={`Image for ${course.name}`}
                          width={100}
                          height={100}
                          className="h-full aspect-square object-contain rounded-lg"
                        />
                        <div className="flex w-full items-start flex-col">
                          <Link
                            href={`/courses/${course.id}`}
                            className="text-xl font-bold hover:underline"
                          >
                            {course.name}
                          </Link>
                          <p className="text-base text-primary">
                            <span className="font-semibold">Тайлбар: </span>
                            {course.description}
                          </p>
                          <p>
                            <span className="font-semibold">
                              Нийт сурагчдын тоо:{" "}
                            </span>
                            {course.student_count}
                          </p>
                          <p>
                            <span className="font-semibold">Хугацаа: </span>
                            {format(course.start_date, "yyyy/MM/dd")} -{" "}
                            {format(course.end_date, "yyyy/MM/dd")}
                          </p>
                        </div>
                      </div>
                      {currentlyActiveLessons.some(
                        (lesson) => lesson.course_id === course.id,
                      ) && <span className="animate-pulse">Идэвхитэй</span>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="md:p-5">
                    {transofrmedData
                      .filter((el) => el.course_id === course.id)
                      .map((data) => (
                        <Accordion type="multiple">
                          {data.lessons.map((lesson) => (
                            <AccordionItem
                              key={lesson.lesson_title}
                              value={lesson.lesson_title}
                            >
                              <AccordionTrigger className="hover:no-underline text-lg font-semibold text-left">
                                <Link
                                  href={`/lessons/${lesson.lesson_id}`}
                                  className="hover:underline"
                                >
                                  {lesson.lesson_title}
                                </Link>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ScrollArea className="max-w-full space-x-3 whitespace-nowrap">
                                  {lesson.dates.map((date) => (
                                    <SingleLessonProgressChart
                                      key={date.attendance_date}
                                      lessonData={date}
                                    />
                                  ))}
                                  <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          <TabsContent value="lesson-charts" className="w-full">
            <LessonsCalendar lessons={lessons} />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
