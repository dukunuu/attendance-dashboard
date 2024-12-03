"use client";

import { useState, useEffect } from "react";
import { useQRCode } from "next-qrcode";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DragAndDropInput from "../drag-and-drop-input";
import { DialogClose } from "@radix-ui/react-dialog";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AttendanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "qr" | "image";
  link?: string;
  title?: string;
  lessonId?: string;
};

export function AttendanceDialog({
  open,
  onOpenChange,
  type,
  link,
  title = "Attendance",
  lessonId,
}: AttendanceDialogProps) {
  const { Canvas } = useQRCode();
  const [qrValue, setQrValue] = useState(link || "");
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setPreview(URL.createObjectURL(acceptedFiles[0]));
  };

  const { toast } = useToast();

  const handleAttendance = async () => {
    if (type === "qr") {
      return;
    }
    const base64 = await files[0].arrayBuffer();

    const body = {
      collection_id: lessonId,
      image: Buffer.from(base64).toString("base64"),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/take-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Амжилттай",
          description: "Амжилттай бүртгэгдлээ",
        });
      } else {
        toast({
          title: "Алдаа",
          description: data.message ? data.message : data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Алдаа",
        description: `Бүртгэхэд алдаа гарлаа. Дахин оролдоно уу.`,
        variant: "destructive",
      });
    } finally {
      setFiles([]);
      setPreview(null);
      onOpenChange(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (type === "qr" && link) {
      setQrValue(link);
    }
  }, [type, link]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {type === "qr" && qrValue && (
          <div className="flex items-center justify-center p-6">
            <Canvas
              text={qrValue}
              options={{
                margin: 3,
                scale: 4,
                width: 200,
              }}
            />
          </div>
        )}
        {type === "image" && (
          <>
            <DragAndDropInput
              onDrop={onDrop}
              preview={preview}
              files={files}
              setFiles={setFiles}
            />
            <DialogFooter className="flex justify-between">
              <DialogClose asChild>
                <Button variant="outline">Хаах</Button>
              </DialogClose>
              <Button
                disabled={files.length === 0 || loading}
                variant="default"
                onClick={handleAttendance}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Бүртгэх"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
