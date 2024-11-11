"use client";

import { useState, useMemo } from "react";
import {
  addDays,
  format,
  startOfWeek,
  addMinutes,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { frequencyOptions } from "./helpers";

interface WeekDatePickerProps {
  lessons: Lesson[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekDatePicker({ lessons }: WeekDatePickerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const isLessonVisible = (lesson: Lesson, date: Date) => {
    const startDate = lesson.start_date;
    if (!lesson.is_repeating) return isSameDay(startDate, date);

    const endDate = lesson.end_date ? lesson.end_date : undefined;
    if (endDate && date > endDate) return false;

    if (lesson.frequency === frequencyOptions[0]) {
      const daysSinceStart = Math.floor(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysSinceStart % (lesson.interval || 1) === 0;
    }

    if (lesson.frequency === frequencyOptions[1]) {
      const weeksSinceStart = Math.floor(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
      );
      return (
        weeksSinceStart % (lesson.interval || 1) === 0 &&
        date.getDay() === startDate.getDay()
      );
    }

    if (lesson.frequency === frequencyOptions[2]) {
      return (
        date.getDate() === startDate.getDate() &&
        (date.getMonth() - startDate.getMonth()) % (lesson.interval || 1) === 0
      );
    }

    return false;
  };

  const renderCell = (day: number, hour: number) => {
    const cellDate = addDays(weekStart, day);
    const cellStart = addMinutes(cellDate, hour * 60);
    const cellEnd = addMinutes(cellStart, 59);

    const visibleLessons = lessons.filter((lesson) => {
      if (!isLessonVisible(lesson, cellDate)) return false;
      const lessonStart = lesson.start_date;
      const lessonEnd = addMinutes(lessonStart, lesson.duration);
      return (
        isWithinInterval(cellStart, { start: lessonStart, end: lessonEnd }) ||
        isWithinInterval(cellEnd, { start: lessonStart, end: lessonEnd })
      );
    });

    console.log(visibleLessons);

    return (
      <td key={`${day}-${hour}`} className="border p-1 h-12 align-top">
        {visibleLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="text-xs bg-blue-100 rounded p-1 mb-1 overflow-hidden"
            style={{
              height: `${Math.min(lesson.duration / 60, 1) * 100}%`,
            }}
          >
            Lesson {lesson.id}
          </div>
        ))}
      </td>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Week Schedule</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="sr-only">Previous week</span>
          </Button>
          <span className="font-semibold">
            {format(weekStart, "MMM d")} -{" "}
            {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="sr-only">Next week</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Time</th>
                {DAYS.map((day, index) => (
                  <th key={day} className="border p-2">
                    {day}
                    <br />
                    <span className="text-sm font-normal">
                      {format(addDays(weekStart, index), "dd")}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="border p-2 text-sm">
                    {format(new Date().setHours(hour, 0), "h a")}
                  </td>
                  {DAYS.map((_, day) => renderCell(day, hour))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
