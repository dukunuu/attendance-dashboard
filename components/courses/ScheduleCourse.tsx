"use client";

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Plus } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { durationOptions, frequencyOptions } from "./helpers";
import LessonsTableClient from "./LessonsTableClient";

type Props = {
  lessons: LessonType[];
  setLessonsAction: React.Dispatch<React.SetStateAction<LessonType[]>>;
  isEdit?: boolean;
};
export default function LessonSchedulerWithList({
  lessons,
  setLessonsAction,
  isEdit,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [lessonTypes, setLessonTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [lessonType, setLessonType] = useState<{ id: number; name: string }>(
    lessonTypes[0],
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [duration, setDuration] = useState<{ label: string; value: number }>(
    durationOptions[0],
  );
  const [customDuration, setCustomDuration] = useState<number>(0);
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<string>("");
  const [interval, setInterval] = useState<number>(1);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      return alert("Please fill out all required fields");
    }
    if (!setLessonsAction) {
      return;
    }
    const newLesson: LessonType = {
      type_id: lessonType!.id,
      start_date: startDate!,
      duration:
        duration.label === "Дурын (минут)"
          ? customDuration / 60
          : duration.value,
      is_repeating: isRepeating,
      ...(isRepeating && { frequency, interval, end_date: endDate }),
    } as LessonType;
    setLessonsAction([...lessons, newLesson]);
    setIsOpen(false);
    resetForm();
  };

  const validateForm = () => {
    if (
      !lessonType ||
      !startDate ||
      duration.value < 0 ||
      isNaN(customDuration) ||
      lessons.find((lesson) => lesson.start_date === startDate)
    ) {
      return true;
    }
    if (isRepeating && (!frequency || !interval || !endDate)) {
      return true;
    }
    if (startDate && endDate && startDate > endDate) {
      return true;
    }
    return false;
  };
  const supabase = createClient();
  const setLessonTypesData = async () => {
    const { data } = await supabase.from("lesson_types").select();
    if (data) {
      setLessonTypes(data);
    }
  };

  useEffect(() => {
    setLessonTypesData();
  }, []);

  const resetForm = () => {
    setLessonType(lessonTypes[0]);
    setStartDate(null);
    setDuration(durationOptions[0]);
    setCustomDuration(0);
    setIsRepeating(false);
    setFrequency("");
    setInterval(1);
    setEndDate(null);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold">Хичээлийн хуваарь</h1>
        {isEdit && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Хуваарь нэмэх
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Хичээл хуваарьлах</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonType">Хичээлийн төрөл</Label>
                  <Select
                    value={`${lessonType?.name || ""}`}
                    onValueChange={(val) => {
                      setLessonType(
                        lessonTypes!.find((el) => el.name === val)!,
                      );
                    }}
                  >
                    <SelectTrigger id="lessonType">
                      <SelectValue placeholder="Хичээлийн төрөл" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessonTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Эхлэх огноо ба цаг</Label>
                  <div className="relative">
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full p-2 border rounded-md pl-10"
                      id="startDate"
                    />
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Үргэлжлэх хугацаа</Label>
                  <Select
                    value={duration.label}
                    onValueChange={(val) => {
                      setDuration(
                        durationOptions.find((el) => el.label === val)!,
                      );
                    }}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Үргэлжлэх хугацаа" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem
                          key={option.label}
                          value={`${option.label}`}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {duration.label === "Дурын (минут)" && (
                    <Input
                      type="number"
                      placeholder="Дурын хугацаа оруулна уу (минут)"
                      value={customDuration}
                      max={360}
                      step={1}
                      onChange={(e) =>
                        setCustomDuration(Number.parseInt(e.target.value))
                      }
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRepeating"
                    checked={isRepeating}
                    onCheckedChange={(checked) =>
                      setIsRepeating(checked as boolean)
                    }
                  />
                  <Label htmlFor="isRepeating">Давтах</Label>
                </div>

                {isRepeating && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Давтамж</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger id="frequency">
                          <SelectValue placeholder="Давтамж" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interval">Интервал</Label>
                      <Input
                        type="number"
                        id="interval"
                        min={1}
                        max={7}
                        value={interval}
                        onChange={(e) => setInterval(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Дуусах огноо</Label>
                      <div className="relative w-full">
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          dateFormat="MMMM d, yyyy"
                          className="w-full p-2 border rounded-md pl-10"
                          id="endDate"
                        />
                        <Calendar
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Schedule Lesson
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <LessonsTableClient
        lessons={lessons}
        setLessonsAction={setLessonsAction}
        lessonTypes={lessonTypes}
      />
    </>
  );
}
