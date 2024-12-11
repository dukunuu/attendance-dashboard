"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import DragAndDropInput from "./drag-and-drop-input";

const steps = [
  { title: "Хувийн мэдээлэл", description: "Нэр, овог, зураг оруулах" },
  { title: "Холбоо барих", description: "Утасны дугаар баталгаажуулах" },
  { title: "Сургууль", description: "Сургууль сонгох" },
];

type FormData = {
  first_name: string;
  last_name: string;
  files: File[];
  phone_number: string;
  school_id: string;
};

const useProfileSetup = (userId: string) => {
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    files: [],
    phone_number: "",
    school_id: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (page === 1) {
      if (!formData.first_name) newErrors.first_name = "Нэр оруулна уу";
      if (!formData.last_name) newErrors.last_name = "Овог оруулна уу";
      if (files.length === 0) newErrors.files = "Зураг оруулна уу";
    } else if (page === 2) {
      if (!formData.phone_number)
        newErrors.phone_number = "Утасны дугаар оруулна уу";
      else if (formData.phone_number.length !== 8)
        newErrors.phone_number = "Утасны дугаар 8 оронтой байх ёстой";
    } else if (page === 3) {
      if (!formData.school_id) newErrors.school_id = "Сургууль сонгоно уу";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = async () => {
    if (validateForm()) {
      if (page === 3) {
        await finishProfileSetup();
      } else {
        setPage((prev) => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    setPage((prev) => prev - 1);
  };

  const verifyPhoneNumber = async () => {
    setSendingCode(true);
    try {
      // Simulating API call for phone verification
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
      setPhoneVerified(false);
      toast({
        title: "Баталгаажуулах код илгээгдлээ",
        description: `Таны утас руу илгээсэн код: ${code}`,
      });
    } catch (error) {
      toast({
        title: "Алдаа гарлаа",
        description:
          "Утасны дугаар баталгаажуулахад алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const finishProfileSetup = async () => {
    setIsLoading(true);
    try {
      const imageFormData = new FormData();
      imageFormData.append("file", files[0]);
      imageFormData.append(
        "path",
        `${userId}/profile.${files[0].name.split(".").pop()}`,
      );
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: imageFormData,
      });
      const { imageUrl } = await res.json();
      if (!imageUrl) {
        toast({
          title: "Алдаа гарлаа",
          description: "Зураг оруулахад алдаа гарлаа. Дахин оролдоно уу.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          image_url: imageUrl,
          school_id: formData.school_id,
        })
        .eq("id", userId);
      if (error) {
        toast({
          title: "Алдаа гарлаа",
          description: "Профайл үүсгэхэд алдаа гарлаа: " + error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Амжилттай",
        description: "Таны профайл амжилттай үүслээ.",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Алдаа гарлаа",
        description: "Профайл үүсгэхэд алдаа гарлаа: " + error,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase.from("schools").select("id, name");
      if (error) {
        console.error("Error fetching schools:", error);
        setSchools([]);
        return;
      }
      setSchools(data);
    };
    fetchSchools();
  }, []);

  return {
    page,
    formData,
    errors,
    isLoading,
    schools,
    phoneVerified,
    verificationCode,
    handleChange,
    handleNext,
    files,
    setFiles,
    handlePrevious,
    verifyPhoneNumber,
    sendingCode,
    setPhoneVerified,
  };
};

export default function EnhancedProfileSetup({ userId }: { userId: string }) {
  const {
    page,
    formData,
    errors,
    files,
    isLoading,
    schools,
    phoneVerified,
    verificationCode,
    sendingCode,
    handleChange,
    handleNext,
    setFiles,
    handlePrevious,
    verifyPhoneNumber,
    setPhoneVerified,
  } = useProfileSetup(userId);

  const [preview, setPreview] = useState<string | null>(null);
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

  return (
    <Card className="w-full flex flex-col relative max-w-lg h-full overflow-y-auto">
      <CardHeader>
        <CardTitle>Профайл үүсгэх</CardTitle>
        <CardDescription>{steps[page - 1].description}</CardDescription>
      </CardHeader>
      <CardContent className="h-full flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex"
          >
            {page === 1 && (
              <div className="space-y-4 w-full flex flex-col justify-center">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Нэр</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500">{errors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Овог</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500">{errors.last_name}</p>
                  )}
                </div>
                <DragAndDropInput
                  onDrop={onDrop}
                  preview={preview}
                  files={files}
                  setFiles={setFiles}
                />
                {errors.files && (
                  <p className="text-sm text-red-500">{errors.files}</p>
                )}
              </div>
            )}
            {page === 2 && (
              <div className="space-y-4 flex w-full justify-center flex-col">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Утасны дугаар</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) =>
                      handleChange("phone_number", e.target.value)
                    }
                  />
                  {errors.phone_number && (
                    <p className="text-sm text-red-500">
                      {errors.phone_number}
                    </p>
                  )}
                </div>
                <Button onClick={verifyPhoneNumber} disabled={sendingCode}>
                  {sendingCode ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {phoneVerified ? "Код дахин илгээх" : "Баталгаажуулах"}
                </Button>
                {verificationCode && (
                  <div className="space-y-2">
                    <Label htmlFor="verification_code">
                      Баталгаажуулах код
                    </Label>
                    <Input
                      id="verification_code"
                      placeholder="Баталгаажуулах кодоо оруулна уу"
                      onChange={(e) => {
                        if (e.target.value === verificationCode) {
                          setPhoneVerified(true);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {page === 3 && (
              <div className="space-y-4 flex w-full justify-center flex-col">
                <div className="space-y-2">
                  <Label htmlFor="school">Сургууль</Label>
                  <Select
                    onValueChange={(value) => handleChange("school_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Сургууль сонгоно уу" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.school_id && (
                    <p className="text-sm text-red-500">{errors.school_id}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between">
        {page > 1 && (
          <Button onClick={handlePrevious} variant="outline">
            Өмнөх
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={isLoading || (page === 2 && !phoneVerified)}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {page === 3 ? "Дуусгах" : "Дараах"}
        </Button>
      </CardFooter>
      <div className="w-full sticky bottom-0 bg-gray-200 h-2 mt-4">
        <div
          className="bg-primary h-2 transition-all duration-300 ease-in-out"
          style={{ width: `${(page / steps.length) * 100}%` }}
        />
      </div>
    </Card>
  );
}
