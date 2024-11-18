"use client";

import ScheduleCourse from "@/components/courses/ScheduleCourse";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import DragAndDropInput from "@/components/drag-and-drop-input";

export default function AddCoursePage() {
  const [user, setUser] = useState<User>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const supabase = createClient();

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
    const course: Omit<ICourse, "id" | "end_date" | "start_date"> = {
      name,
      description,
      is_hidden: false,
      imageUrl: "",
      user_id: user!.id,
    };
    const { data } = await supabase
      .from("courses")
      .insert([course])
      .select()
      .returns<ICourse[]>();
    if (data) {
      const imageFormData = new FormData();
      imageFormData.append("file", files[0]);
      imageFormData.append(
        "path",
        `${user!.id}/courses/${data[0].id}.${files[0].name.split(".").pop()}`,
      );
      const { imageUrl } = await fetch("/api/upload-image", {
        method: "POST",
        body: imageFormData,
      }).then((res) => res.json());
      await supabase
        .from("courses")
        .update({ imageUrl: imageUrl })
        .eq("id", data[0].id);
      const courseLessons = lessons.map((lesson) => ({
        ...lesson,
        course_id: data[0].id,
      }));
      await supabase.from("lessons").insert(courseLessons);
      window.location.href = `/courses`;
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

  useEffect(() => {
    setUserData();
  }, []);
  return (
    <div className="flex flex-col flex-1 w-full justify-center items-center">
      <h1 className="text-xl font-bold mb-5">Хичээл нэмэх</h1>
      <form action={onSubmit} className="flex w-full flex-col gap-5 max-w-5xl">
        <div className="flex md:flex-row flex-col gap-5 w-full">
          <div className="flex flex-col w-full gap-5">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Хичээлийн нэр"
              maxLength={50}
              className="w-full"
            />
            <div className="flex relative h-min w-full">
              <textarea
                value={description}
                onChange={onTextAreaChange}
                placeholder="Тайлбар"
                cols={30}
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
        <ScheduleCourse
          lessons={lessons}
          setLessonsAction={setLessons}
          isEdit
        />
        <SubmitButton disabled={!validateForm()} type="submit">
          Нэмэх
        </SubmitButton>
      </form>
    </div>
  );
}
