import { CalendarEvent } from "@/components/courses/FullCalendar";

declare global {
  interface ILesson {
    id: string;
    title: string;
    course_id: number;
    dates?: Omit<CalendarEvent, "id" | "title">[];
    photo_request_count?: number;
  }
  interface ICourse {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    user_id: string;
    start_date: string;
    end_date: string;
    is_hidden: boolean;
    student_count?: number;
    created_at?: string;
  }
  type LessonType = Omit<ILesson, "id">;
  type CoursesActions = {
    createCourse: (course: ICourse) => void;
    updateCourse: (course: ICourse) => void;
    deleteCourse: (id: number) => void;
  };
  type UserRole = "admin" | "teacher" | "school_admin";
  interface IStudent {
    id: number;
    first_name: string;
    last_name: string;
    student_code: string;
    school_id: number;
    imageUrl: string;
    attendance_data?: { date: string; present: boolean }[];
  }
  interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    image_url: string;
    phone_number: string;
    school_id: number;
  }
}

export {};
