import { createClient } from "@/utils/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { format } from "date-fns";
import { durationOptions, frequencyOptions } from "./helpers";
import Link from "next/link";
import { Button } from "../ui/button";

const fetchLessonTypes = async (): Promise<{ id: number; name: string }[]> => {
  const supabase = await createClient();
  const { data: lessonTypes } = await supabase
    .from("lesson_types")
    .select("*")
    .returns<{ id: number; name: string }[]>();
  return lessonTypes || [];
};

const daysOfWeek = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export default async function LessonsTable({ lessons }: { lessons: Lesson[] }) {
  const lessonTypes = await fetchLessonTypes();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Төрөл</TableHead>
          <TableHead>Эхлэх огноо</TableHead>
          <TableHead>Нэгж хичээлийн хугацаа</TableHead>
          <TableHead>Давтамж</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lessons.map((lesson, index) => (
          <TableRow key={index}>
            <TableCell>
              <Button variant="link" asChild>
                <Link href={`/lessons/${lesson.id}`}>
                  {lessonTypes.find((type) => type.id === lesson.type_id)!.name}
                </Link>
              </Button>
            </TableCell>
            <TableCell>
              {format(lesson.start_date, "MMM d, yyyy h:mm a")}
            </TableCell>
            <TableCell>
              {durationOptions.find((el) => el.value === lesson.duration)
                ?.label ||
                `${Math.floor(lesson.duration) === 0
                  ? ""
                  : Math.floor(lesson.duration) + " цаг"
                }
                ${(lesson.duration % 1) * 60 === 0 ? "" : `${(lesson.duration % 1) * 60} минут`}`}
            </TableCell>
            <TableCell>
              {lesson.is_repeating ? (
                <span>
                  {lesson.interval === 1
                    ? (() => {
                      switch (true) {
                        case lesson.frequency === frequencyOptions[0]:
                          return `${lesson.interval}`;
                        case lesson.frequency === frequencyOptions[1]:
                          return (
                            daysOfWeek[lesson.start_date.getDay()] +
                            " гараг бүрт"
                          );
                        case lesson.frequency === frequencyOptions[2]:
                          return "Сар бур";
                        default:
                          return "htll";
                      }
                    })()
                    : ""}
                  {lesson.end_date &&
                    `, ${lesson.end_date.toLocaleDateString("mn-MN")}-д хаагдана`}
                </span>
              ) : (
                "Давтамжгүй"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
