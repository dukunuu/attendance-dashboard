"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CourseSelectProps = {
  courses: { id: number; name: string }[];
  selectedCourse?: string;
};

export default function CourseSelect({
  courses,
  selectedCourse,
}: CourseSelectProps) {
  const router = useRouter();

  const handleCourseChange = (value: string) => {
    if (value === "all") return router.push("/students");
    router.push(`/students?course=${value}`);
  };

  return (
    <Select onValueChange={handleCourseChange} defaultValue={selectedCourse}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Хичээл сонгох" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Бүх сурагчид</SelectItem>
        {courses.map((course) => (
          <SelectItem key={course.id} value={`${course.id}`}>
            {course.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
