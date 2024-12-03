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

export const handleFileChange = async (
  event: React.ChangeEvent<HTMLInputElement>,
): Promise<Omit<IStudent, "id" | "school_id">[]> => {
  const file = event.target.files?.[0];
  let parsedData: Omit<IStudent, "id" | "school_id">[] = [];

  if (!file) {
    return parsedData;
  }

  try {
    const fileContent = await readFileAsText(file);
    const lines = fileContent.split("\r");
    const headers = lines[0].split(",").map((header) => header.trim());

    lines.slice(1).forEach((line) => {
      const values = line.split(",").map((value) => value.trim());
      if (values.length === headers.length) {
        parsedData.push({
          first_name: values[headers.indexOf("first_name")],
          last_name: values[headers.indexOf("last_name")],
          student_code: values[headers.indexOf("student_code")],
          imageUrl: values[headers.indexOf("imageUrl")],
        });
      }
    });

    return parsedData;
  } catch {
    return parsedData;
  }
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject();
    reader.readAsText(file);
  });
};

export const uploadCsvImagesToS3 = async (
  csvData: Omit<IStudent, "id" | "school_id">[],
  data: IStudent[],
) => {
  const images = csvData.map((student) => ({
    imageUrl: student!.imageUrl,
    student_code: student!.student_code,
  }));
  const imageUrls = [];
  try {
    for (let i = 0; i < images.length; i++) {
      if (
        images[i].imageUrl.startsWith(
          `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com`,
        )
      ) {
        continue;
      }
      const studentImages = data.map((student) => student.imageUrl);
      if (studentImages.includes(images[i].imageUrl)) {
        imageUrls.push(images[i].imageUrl);
        continue;
      }
      const response = await fetch(images[i].imageUrl).catch((error) => {
        console.error("Error fetching image: ", error);
      });
      if (!response) {
        continue;
      }
      const blob = await response.blob();
      const file = new File([blob], "image.jpeg", { type: "image/jpeg" });
      const path = `students/${images[i].student_code}.jpeg`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);
      const s3Response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const { imageUrl } = await s3Response.json();
      console.log("Image uploaded to S3: ", imageUrl);
      imageUrls.push(imageUrl as string);
    }
    return imageUrls;
  } catch (error) {
    console.error("Error uploading images to S3: ", error);
    return imageUrls;
  }
};
