declare global {
  interface Lesson {
    id: number;
    type_id: number;
    course_id: number;
    start_date: Date;
    duration: number;
    is_repeating: boolean;
    frequency?: string;
    interval?: number;
    end_date?: Date;
    is_hidden: boolean;
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
  }
  type LessonType = Omit<Lesson, "id">;
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

export { };
