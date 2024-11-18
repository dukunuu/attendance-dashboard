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
      className={`p-8 w-full border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ease-in-out ${isDragActive
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
              className="flex items-center gap-10 w-full justify-between bg-gray-100 dark:bg-[#1e1e1e] p-2 rounded"
            >
              <div className="flex items-center space-x-2">
                <File className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">
                  {truncateWithDots(file.name, 20)}
                </span>
              </div>
              <div className="flex space-x-2">
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
                    className="sm:max-w-[425px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DialogHeader>
                      <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 flex justify-center">
                      {preview && (
                        <img
                          src={preview}
                          alt="Preview"
                          className="max-w-full h-auto rounded-lg"
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
          <div className="text-lg font-medium">Upload image</div>
          <p className="text-sm text-gray-500">
            Drag and drop your image here, or click to select a file
          </p>
        </div>
      )}
    </div>
  );
}