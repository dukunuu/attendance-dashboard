"use client";

import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import DragAndDropInput from "@/components/drag-and-drop-input";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarEvent,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarWeekView,
} from "@/components/courses/FullCalendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mn } from "date-fns/locale";
import { getCourse, getLessons } from "@/app/actions";
import { parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Props = { params: { courseId: string } };

export default function EditCoursePage({ params }: Props) {
  const { courseId } = params;
  const [user, setUser] = useState<User>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [imageChanged, setImageChanged] = useState(false);
  const [defaultLessons, setDefaultLessons] = useState<CalendarEvent[]>([]);
  const supabase = createClient();
  const { toast } = useToast();

  const onTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const validateForm = useCallback(() => {
    if (name.length < 3) {
      return false;
    }
    if (description.length < 10) {
      return false;
    }
    if (lessons.length === 0) {
      return false;
    }
    return true;
  }, [name, description, lessons]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImageChanged(true);
    setFiles(acceptedFiles);
    if (acceptedFiles[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(acceptedFiles[0]);
    }
  }, []);

  const onSubmit = async () => {
    if (imageChanged && files.length !== 0) {
      const imageFormData = new FormData();
      imageFormData.append("file", files[0]);
      imageFormData.append(
        "path",
        `${user!.id}/courses/${courseId}.${files[0].name.split(".").pop()}`,
      );
      const { imageUrl } = await fetch("/api/upload-image", {
        method: "POST",
        body: imageFormData,
      }).then((res) => res.json());
      await supabase
        .from("courses")
        .update({ imageUrl: imageUrl })
        .eq("id", Number.parseInt(courseId));
    }
    const course: Partial<ICourse> = {
      name,
      description,
    };
    const { data, error } = await supabase
      .from("courses")
      .update([course])
      .eq("id", Number.parseInt(courseId))
      .select()
      .returns<ICourse[]>();
    if (error) {
      console.error(error);
      toast({
        title: "Алдаа гарлаа",
        description: "Хичээлийг засахад алдаа гарлаа: " + error.message,
        variant: "destructive",
      });
      return;
    }
    if (data) {
      const setLessons = new Set(defaultLessons.map((lesson) => lesson.id));
      const newLessons = lessons.filter((lesson) => !setLessons.has(lesson.id));
      const updatedLessons = lessons.filter((lesson) =>
        setLessons.has(lesson.id),
      );
      const deletedLessons = defaultLessons.filter(
        (el) => !lessons.some((lesson) => lesson.id === el.id),
      );
      if (newLessons.length > 0) {
        const { error: lessonError } = await supabase
          .from("lessons")
          .insert(newLessons);
        if (lessonError) {
          console.error(lessonError);
          toast({
            title: "Алдаа гарлаа",
            description:
              "Шинэ хичээлүүдийг хадгалахад алдаа гарлаа: " +
              lessonError.message,
            variant: "destructive",
          });
          return;
        }
      }
      if (updatedLessons.length > 0) {
        const { error: lessonError } = await supabase
          .from("lessons")
          .upsert(updatedLessons);
        if (lessonError) {
          console.error(lessonError);
          toast({
            title: "Алдаа гарлаа",
            description:
              "Хичээлийн хичээлүүдийг засахад алдаа гарлаа: " +
              lessonError.message,
            variant: "destructive",
          });
          return;
        }
      }
      if (deletedLessons.length > 0) {
        const { error: lessonError } = await supabase
          .from("lessons")
          .delete()
          .eq("course_id", Number.parseInt(courseId))
          .in(
            "id",
            deletedLessons.map((lesson) => lesson.id),
          );
        if (lessonError) {
          console.error(lessonError);
          toast({
            title: "Алдаа гарлаа",
            description:
              "Хичээлийн хичээлүүдийг засахад алдаа гарлаа: " +
              lessonError.message,
            variant: "destructive",
          });
          return;
        }
      }
      window.location.href = `/courses/${data[0].id}`;
    }
  };

  const setUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    }
  };

  const handleEventChange = (events: CalendarEvent[]) => {
    const eventsWithUniqueTitles = events.filter(
      (event, index, self) =>
        self.findIndex((e) => e.title === event.title) === index,
    );
    console.log(eventsWithUniqueTitles);

    const lessons = eventsWithUniqueTitles.map((event) => {
      const lesson: ILesson = {
        id: event.id,
        title: event.title,
        course_id: Number.parseInt(courseId),
        dates: events
          .filter((e) => e.title === event.title)
          .map((e) => ({ start: e.start, end: e.end, color: e.color })),
      };
      return lesson;
    });
    setLessons(lessons);
  };

  const setFormData = async () => {
    const courseData = await getCourse(courseId);
    if (!courseData) {
      return;
    }
    setName(courseData.name);
    setDescription(courseData.description);
    setPreview(courseData.imageUrl);
    setFiles([new File([], courseData.imageUrl)]);
    const lessons = await getLessons(courseData.id);
    if (lessons.length === 0) {
      return;
    }
    setDefaultLessons(
      lessons.flatMap((lesson) =>
        lesson.dates!.map((date) => ({
          id: `${lesson.id}`,
          title: lesson.title,
          color: date.color || "default",
          start: new Date(parseISO(date.start as unknown as string)),
          end: new Date(parseISO(date.end as unknown as string)),
        })),
      ),
    );
    setLessons(lessons);
  };

  useEffect(() => {
    setUserData();
  }, []);

  useEffect(() => {
    setFormData();
  }, []);
  return (
    <div className="flex flex-col flex-1 w-full justify-center items-center">
      <h1 className="text-xl font-bold mb-5">Хичээл засах</h1>
      <form action={onSubmit} className="flex w-full flex-col gap-5 max-w-5xl">
        <div className="flex md:flex-row flex-col gap-5 w-full">
          <div className="flex flex-col w-full gap-5">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Хичээлийн нэр"
              required
              maxLength={50}
              className="w-full"
            />
            <div className="flex relative h-min w-full">
              <textarea
                value={description}
                onChange={onTextAreaChange}
                placeholder="Тайлбар"
                cols={30}
                required
                maxLength={2000}
                className="flex min-h-[130px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full"
              />
              <span className="absolute bottom-2 right-2 text-sm text-gray-500">
                {description.length}/2000
              </span>
            </div>
          </div>
          <hr />
        </div>
        <DragAndDropInput
          onDrop={onDrop}
          preview={preview}
          files={files}
          setFiles={setFiles}
        />
        {lessons.length > 0 && (
          <Calendar
            view="week"
            locale={mn}
            isEditable
            events={defaultLessons}
            setEvents={handleEventChange}
          >
            <div className="h-dvh flex flex-col">
              <div className="flex px-6 justify-evenly items-center gap-2 mb-6">
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
        )}
        <SubmitButton disabled={!validateForm()} type="submit">
          Засах
        </SubmitButton>
      </form>
    </div>
  );
}
