"use client";

import { createClient } from "@/utils/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { addMinutes, format, isWithinInterval } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash";
import { Button } from "../ui/button";
import { Download, Image, Loader2, QrCode, Upload } from "lucide-react";
import AddStudentDialog from "../add-student-dialog";
import { addStudentsToLesson } from "@/app/actions";
import { AttendanceDialog } from "./AttendanceDialog";
import Spreadsheet from "./Spreadsheet";
import { useToast } from "@/hooks/use-toast";
import CSVPreviewDialog from "../csv-preview-dialog";
import { handleFileChange } from "../students/helpers";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export default function AttendanceSpreadsheet({ lesson }: { lesson: ILesson }) {
  if (!lesson.dates) return null;
  const supabase = createClient();
  const [students, setStudents] = useState<IStudent[]>([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [qrLink, setQrLink] = useState(defaultUrl);
  const [openImage, setOpenImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const changesRef = useRef<IStudent[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [csvData, setCsvData] = useState<Omit<IStudent, "id" | "school_id">[]>(
    [],
  );
  const [isSubmitting, setIsSubmittin] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const lessonCurrentlyInSession = useMemo(() => {
    const now = new Date();
    return lesson.dates!.some((date) => isWithinInterval(now, date));
  }, [lesson]);

  const save = useCallback(
    debounce(async () => {
      if (changesRef.current.length === 0) return;

      const data = changesRef.current.map((student) => ({
        student_id: student.id,
        attendance_data: student.attendance_data,
        lesson_id: lesson.id,
      }));

      const { error } = await supabase.rpc("update_attendance_data", {
        p_attendance_updates: data,
      });
      changesRef.current = [];
      setIsSaving(false);

      if (error) {
        toast({
          title: "Error",
          description: "Алдаа гарлаа. Дахин оролдоно уу",
          variant: "destructive",
        });
        return;
      }
    }, 4000),
    [lesson.id, supabase],
  );

  const handleCellChange = useCallback(
    (studentCode: number, date: string, present: boolean) => {
      setStudents((prevStudents) => {
        const updatedStudents = prevStudents.map((student) => {
          if (student.id === studentCode) {
            const attendanceData = student.attendance_data!.map((ad) => {
              if (ad.date === date) {
                return { ...ad, present };
              }
              return ad;
            });
            return { ...student, attendance_data: attendanceData };
          }
          return student;
        });

        const changedStudent = updatedStudents.find(
          (s) => s.id === studentCode,
        );
        if (changedStudent) {
          const existingIndex = changesRef.current.findIndex(
            (s) => s.id === studentCode,
          );
          if (existingIndex !== -1) {
            changesRef.current[existingIndex] = changedStudent;
          } else {
            changesRef.current.push(changedStudent);
          }
        }

        return updatedStudents;
      });

      setIsSaving(true);
      save();
    },
    [save],
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const csvStudents = await handleFileChange(event);
    if (csvStudents) {
      setIsPreviewOpen(true);
      setCsvData(csvStudents);
      return;
    }
    toast({
      title: "Error",
      description: "Invalid CSV file.",
    });
  };

  const handleUpload = async () => {
    setIsSubmittin(true);
    await addStudentToLesson(csvData as IStudent[]);
    setCsvData([]);
    setIsPreviewOpen(false);
    setIsSubmittin(false);
  };

  const generateQRCode = async () => {
    setQrLoading(true);
    const { data, error } = await supabase
      .from("attendance_qrs")
      .upsert({ id: lesson.id, expiry_date: addMinutes(new Date(), 5) })
      .select("link_id")
      .single();
    setQrLoading(false);
    setOpen(true);
    if (error) {
      return;
    }
    console.log(`${defaultUrl}/attendance/${data.link_id}`);
    setQrLink(`${defaultUrl}/attendance/${data.link_id}`);
  };

  const addStudentToLesson = async (newStudents: IStudent[]) => {
    const studentData = newStudents.map((student) => ({
      ...student,
      attendance_data: lesson.dates!.map((date) => ({
        date: date.start as unknown as string,
        close: date.end as unknown as string,
        present: false,
      })),
    }));
    setStudents((prev) => [...prev, ...studentData]);
    const images = [...students, ...newStudents].map((student) => {
      const cleanUrl = student.imageUrl.split("?")[0];

      const parts = cleanUrl.split("/");

      const folder = parts[parts.length - 2];
      const filename = parts[parts.length - 1];

      return `${folder}/${filename}`;
    });
    const error = await addStudentsToLesson(lesson.id, newStudents);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    try {
      await fetch("/api/create-lesson-images", {
        method: "POST",
        body: JSON.stringify({ images, lessonId: lesson.id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast({
        title: "Success",
        description: "Сурагчийн мэдээлэл амжилттай нэмэгдлээ",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Сурагчийн зурагуудыг үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      });
      return;
    }
  };

  const fetchStudents = useCallback(async () => {
    const { data, error } = await supabase
      .rpc("get_students_in_lesson", { p_lesson_id: lesson.id })
      .returns<IStudent[]>();
    if (error) {
      toast({
        title: "Error",
        description: "Сурагчидыг татаж авахад алдаа гарлаа",
        variant: "destructive",
      });
    }
    if (!data) return;
    setStudents(
      data.sort((a, b) => a.student_code.localeCompare(b.student_code)),
    );
  }, [lesson]);

  const handleDelete = async (studentId: number) => {
    const { error } = await supabase.rpc("delete_student_from_lesson", {
      p_student_id: studentId,
      p_lesson_id: lesson.id,
    });
    if (error) {
      toast({
        title: "Error",
        description: "Сурагчийг хичээлийн жагсаалтаас хасахад алдаа гарлаа",
        variant: "destructive",
      });
      return;
    }
    setStudents((prev) => prev.filter((student) => student.id !== studentId));
    toast({
      title: "Success",
      description: "Сурагчийг хичээлийн жагсаалтаас хаслаа",
      variant: "default",
    });
  };

  const exportToCSV = async () => {
    const csv = students.map((student) => {
      const attendanceData = student.attendance_data!.map((ad) => {
        return ad.present ? "1" : "0";
      });
      return `${student.student_code},${student.last_name.at(0)}.${student.first_name},${attendanceData.join(",")}`;
    });
    const csvHeader = `Код,Нэр,${lesson.dates!.map((date) => format(date.start, "dd/mm/yyyy")).join(",")}`;
    const csvString = [csvHeader, ...csv].join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    return () => {
      save.flush();
    };
  }, [save]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex md:items-center gap-2 flex-col md:flex-row justify-between w-full">
        <div className="flex gap-2 justify-between md:justify-normal">
          <Button
            disabled={!lessonCurrentlyInSession}
            variant={"outline"}
            onClick={generateQRCode}
          >
            <QrCode />
          </Button>
          <Button
            disabled={!lessonCurrentlyInSession}
            variant={"outline"}
            onClick={() => setOpenImage(true)}
          >
            <Image />
          </Button>
        </div>
        <div className="flex gap-2 w-full flex-wrap">
          <Button
            variant={"outline"}
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.click();
              }
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            CSV oруулах
          </Button>
          <Button className="gap-1" variant={"outline"} onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" /> CSV татах
          </Button>
          <input
            type="file"
            ref={inputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <AddStudentDialog
            lessonId={lesson.id}
            addTo="lesson"
            addStudentsAction={addStudentToLesson}
          />
          <CSVPreviewDialog
            csvData={csvData}
            setCsvData={setCsvData}
            isSubmitting={isSubmitting}
            setIsPreviewOpen={setIsPreviewOpen}
            isPreviewOpen={isPreviewOpen}
            handleUpload={handleUpload}
          />
        </div>
        <AttendanceDialog
          open={open}
          onOpenChange={setOpen}
          type="qr"
          link={qrLink}
        />
        <AttendanceDialog
          open={openImage}
          onOpenChange={setOpenImage}
          type="image"
          lessonId={lesson.id}
        />
      </div>
      <div className="flex items-center justify-end w-full mt-5">
        <span className="text-sm flex gap-1 text-gray-500">
          {isSaving ? (
            <>
              <Loader2 className="animate-spin h-4" />
              Хадгалж байна...
            </>
          ) : (
            "Хадгалагдсан"
          )}
        </span>
      </div>
      <ScrollArea className="max-w-full mt-5 whitespace-nowrap">
        <Spreadsheet
          students={students}
          dates={lesson.dates}
          onEdit={handleCellChange}
          onDelete={handleDelete}
        />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
