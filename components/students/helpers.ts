export function findConflictingStudentIds(
  existingStudents: IStudent[],
  csvStudents: Partial<IStudent>[],
) {
  const existingStudentIds = new Set(
    existingStudents.map((student) => student.student_code),
  );

  const conflictingIds: string[] = [];

  csvStudents.forEach((csvStudent) => {
    if (existingStudentIds.has(csvStudent.student_code!)) {
      conflictingIds.push(csvStudent.student_code!);
    }
  });
  return conflictingIds;
}

export const uploadCsvImagesToS3 = async (
  csvData: Omit<IStudent, "id" | "school_id">[],
  data: IStudent[],
) => {
  const images = csvData.map((student) => ({
    imageUrl: student!.imageUrl,
    student_code: student!.student_code,
  }));
  try {
    const imagePromises = images.map(async (img) => {
      const studentsImages = data.map((student) => student.imageUrl);
      if (studentsImages.includes(img.imageUrl)) {
        return img.imageUrl;
      }
      const response = await fetch(img.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });
      const path = `students/${img.student_code}.jpg`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);
      const s3Response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const { imageUrl } = await s3Response.json();
      return imageUrl as string;
    });
    return await Promise.all(imagePromises);
  } catch (error) {
    console.error("Error uploading images to S3: ", error);
  }
};
