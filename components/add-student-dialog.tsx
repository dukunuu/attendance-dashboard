"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Loader2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AddStudentDialog({
  schoolId,
  courseId,
  lessonId,
  addStudentsAction,
  addTo = "course",
}: {
  schoolId?: number;
  courseId?: number;
  lessonId?: string;
  addTo: "course" | "lesson";
  addStudentsAction: (students: IStudent[]) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<IStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<IStudent[]>([]);
  const supabase = createClient();

  const filteredStudents = students.filter(
    (student) =>
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleStudent = (student: IStudent) => {
    setSelectedStudents((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student],
    );
  };

  const removeStudent = (studentId: number) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  useEffect(() => {
    const fetchStudentsData = async () => {
      setStudentsLoading(true);
      if (addTo === "course") {
        const { data, error } = await supabase
          .rpc("get_students_not_in_course", {
            p_school_id: schoolId,
            p_course_id: courseId,
          })
          .returns<IStudent[]>();
        if (error) {
          console.error(error);
          return;
        }
        setStudents(data);
      } else {
        const { data, error } = await supabase
          .rpc("get_students_not_in_lesson", {
            p_lesson_id: lessonId,
          })
          .returns<IStudent[]>();
        if (error) {
          console.error(error);
          return;
        }
        setStudents(data);
      }
      setStudentsLoading(false);
    };

    if (isOpen) {
      fetchStudentsData();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Сурагч нэмэх</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Сурагч сонгох</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Сурагч хайх..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-[300px] rounded-md items-center justify-center flex flex-col border p-4">
            {studentsLoading && (
              <div className="w-full h-full flex justify-center items-center">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            )}
            {!studentsLoading &&
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleStudent(student)}
                >
                  <div
                    className={`w-5 h-5 border rounded-sm flex items-center justify-center ${
                      selectedStudents.some((s) => s.id === student.id)
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    {selectedStudents.some((s) => s.id === student.id) && (
                      <Check className="w-4 h-4" />
                    )}
                  </div>
                  <img
                    src={student.imageUrl}
                    alt={`${student.first_name} ${student.last_name}`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{`${student.first_name} ${student.last_name}`}</p>
                    <p className="text-sm text-gray-500">
                      {student.student_code}
                    </p>
                  </div>
                </div>
              ))}
          </ScrollArea>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Сонгосон сурагчид:</h3>
          <ScrollArea className="h-[100px] rounded-md border p-2">
            {selectedStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-1"
              >
                <span>{`${student.first_name} ${student.last_name}`}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStudent(student.id)}
                  aria-label={`Remove ${student.first_name} ${student.last_name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </ScrollArea>
        </div>
        <Button
          disabled={selectedStudents.length === 0}
          onClick={async () => {
            setIsLoading(true);
            await addStudentsAction(selectedStudents);
            setSelectedStudents([]);
            setIsLoading(false);
            setIsOpen(false);
          }}
          className="mt-4 space-x-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>Нэмэх</span>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
