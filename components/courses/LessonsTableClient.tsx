"use client";

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
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

const daysOfWeek = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export default function LessonsTable({
  lessons,
  setLessonsAction,
  lessonTypes,
}: {
  lessons: LessonType[];
  setLessonsAction: React.Dispatch<React.SetStateAction<LessonType[]>>;
  lessonTypes: { id: number; name: string }[];
}) {
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
              {lessonTypes.find((type) => type.id === lesson.type_id)!.name}
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
                      switch (lesson.frequency) {
                        case frequencyOptions[0]:
                          return `${lesson.interval}`;
                        case frequencyOptions[1]:
                          return (
                            daysOfWeek[lesson.start_date.getDay()] +
                            " гараг бүрт"
                          );
                        case frequencyOptions[2]:
                          return "";
                        default:
                          return "";
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
            <TableCell>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  setLessonsAction(lessons.filter((_, i) => i !== index));
                }}
              >
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
