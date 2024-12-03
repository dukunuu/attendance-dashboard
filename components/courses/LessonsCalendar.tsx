"use client";

import { mn } from "date-fns/locale";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarEvent,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarWeekView,
} from "./FullCalendar";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LessonsCalendar({ lessons }: { lessons: ILesson[] }) {
  const lessonDates: CalendarEvent[] = lessons.flatMap((lesson) => {
    if (!lesson.dates) return [];
    const { id, title } = lesson;

    return lesson.dates.map((date) => {
      const { start, end, color } = date;
      return {
        id: `${id}`,
        title,
        start: new Date(start),
        end: new Date(end),
        color,
      };
    });
  });
  return (
    <Calendar events={lessonDates} isEditable={false} view="week" locale={mn}>
      <div className="h-dvh md:p-14 p-2 flex flex-col">
        <div className="flex justify-evenly items-center gap-2 mb-6">
          <CalendarPrevTrigger>
            <ChevronLeft size={20} />
            <span className="sr-only">Previous</span>
          </CalendarPrevTrigger>
          <CalendarCurrentDate />
          <CalendarNextTrigger>
            <ChevronRight size={20} />
            <span className="sr-only">Next</span>
          </CalendarNextTrigger>
        </div>

        <div className="flex-1 overflow-hidden">
          <CalendarWeekView />
        </div>
      </div>
    </Calendar>
  );
}
