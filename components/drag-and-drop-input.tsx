import { Cloud, X, File, Eye } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useDropzone } from "react-dropzone";
import { truncateWithDots } from "./courses/helpers";

type Props = {
  onDrop: (files: File[]) => void;
  preview: string | null;
  files: File[];
  setFiles: (files: File[]) => void;
};

export default function DragAndDropInput({
  onDrop,
  preview,
  files,
  setFiles,
}: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    multiple: false,
  });

  const removeFile = () => {
    setFiles([]);
  };

  return (
    <div
      {...getRootProps()}
      className={`md:p-8 p-2 w-full border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ease-in-out ${
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-gray-300 hover:border-primary"
      }`}
    >
      <input {...getInputProps()} />
      {files.length > 0 ? (
        <div className="space-y-4 flex flex-col w-full">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center md:gap-10 gap-2 w-full justify-between bg-gray-100 dark:bg-[#1e1e1e] p-2 rounded"
            >
              <div className="flex items-center space-x-2 w-full">
                <File className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium truncate">
                  {truncateWithDots(file.name, 20)}
                </span>
              </div>
              <div className="flex space-x-2 w-full">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Preview image"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="sm:max-w-[425px] w-full flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DialogHeader>
                      <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 w-full flex justify-center">
                      {preview && (
                        <img
                          src={preview}
                          alt="Preview image"
                          className="w-full rounded-lg object-contain"
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Cloud className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-lg font-medium">Зураг оруулах</div>
          <p className="text-sm text-gray-500">
            Зургийг энд дарж оруулна уу эсвэл дараах зургийг дарж оруулна уу
          </p>
        </div>
      )}
    </div>
  );
}
