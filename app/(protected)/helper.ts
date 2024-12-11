import { PostgrestError } from "@supabase/supabase-js";

export interface LessonData {
  lesson_id: number;
  lesson_title: string;
  attendance_date: string;
  present_count: number;
  student_count: number;
  course_id: number;
}

interface DateDetails {
  attendance_date: string;
  present_count: number;
  student_count: number;
}

interface LessonDetails {
  lesson_id: number;
  lesson_title: string;
  dates: DateDetails[];
}

interface TransformedData {
  course_id: number;
  lessons: LessonDetails[];
}

// Helper function to transform the data
export function transformAttendanceData(data: LessonData[]): TransformedData[] {
  return Object.values(
    data.reduce<Record<number, TransformedData>>((acc, lesson) => {
      const {
        course_id,
        lesson_id,
        lesson_title,
        attendance_date,
        present_count,
        student_count,
      } = lesson;

      if (!acc[course_id]) {
        acc[course_id] = { course_id, lessons: [] };
      }

      // Check if the lesson already exists
      let lessonDetails = acc[course_id].lessons.find(
        (l) => l.lesson_id === lesson_id,
      );
      if (!lessonDetails) {
        lessonDetails = { lesson_id, lesson_title, dates: [] };
        acc[course_id].lessons.push(lessonDetails);
      }

      // Add date details
      lessonDetails.dates.push({
        attendance_date,
        present_count,
        student_count,
      });

      lessonDetails.dates.sort((a, b) =>
        a.attendance_date.localeCompare(b.attendance_date),
      );

      return acc;
    }, {}),
  );
}

export function isPostgressError(error: any): error is PostgrestError {
  return (<PostgrestError>error).message !== undefined;
}
