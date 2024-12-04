"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: "John",
        last_name: "Doe",
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const fetchCourseStudents = async (school_id: number, id?: string) => {
  "use server";

  const supabase = await createClient();
  if (!id) {
    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .eq("school_id", school_id)
      .returns<IStudent[]>();
    if (error) {
      console.error(error);
      return [];
    }
    return students || [];
  }

  if (isNaN(Number.parseInt(id))) {
    console.error("Invalid course id");
    return [];
  }

  const { data, error } =
    (await supabase
      .from("course_students")
      .select(
        `
            student_id,
            students (
              *
            )
        `,
      )
      .eq("course_id", Number.parseInt(id))
      .returns<{ students: IStudent[] }[]>()) || [];
  if (error) {
    console.error(error);
    return [];
  }
  return data.map((item) => item.students).flat();
};

export const fetchCourses = async () => {
  "use server";
  const supabase = await createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, name")
    .returns<ICourse[]>();

  if (error) {
    console.error(error);
    return [];
  }
  return courses;
};

export const addStudentToCourse = async (
  courseId: number,
  students: IStudent[],
) => {
  "use server";
  const supabase = await createClient();
  const insertData = students.map((student) => ({
    course_id: courseId,
    student_id: student.id,
  }));
  const { error } = await supabase.from("course_students").insert(insertData);
  if (error) {
    console.error(error);
  }
};

export const addStudentsToLesson = async (
  lessonId: number,
  students: IStudent[],
) => {
  "use server";
  const supabase = await createClient();
  const insertData = students.map((student) => ({
    lesson_id: lessonId,
    student_id: student.id,
  }));
  const { error } = await supabase.rpc("add_students_to_course_lessons", {
    p_student_lesson_pairs: insertData,
  });
  if (error) {
    console.error(error);
  }
};

export const updateAttendance = async (
  p_lesson_id: number,
  p_student_code: string,
  p_first_name: string,
) => {
  "use server";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("take_attendance", {
    p_student_code,
    p_first_name,
    p_lesson_id,
  });
  return { data, error };
};
