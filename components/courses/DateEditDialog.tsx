"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarEvent, useCalendar } from "./FullCalendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { addDays, addMinutes, addWeeks, isBefore, isAfter } from "date-fns";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuid } from "uuid";
import { useToast } from "@/hooks/use-toast";

const monthEventVariants = cva("size-2 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      blue: "bg-blue-500",
      green: "bg-green-500",
      pink: "bg-pink-500",
      purple: "bg-purple-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type Props = {
  open: boolean;
  date?: Date;
  event?: CalendarEvent | null;
  onOpenChange: () => void;
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  startDate: z.date(),
  duration: z
    .number()
    .min(5, "Duration must be at least 5 minutes")
    .max(360, "Duration must be at most 360 minutes"),
  color: z.enum(["default", "blue", "green", "pink", "purple"]),
  isRepeating: z.boolean(),
  frequency: z.enum(["Өдөр бүр", "Долоо хоног бүр", "Сар бүр"]),
  interval: z.number().min(1, "Interval must be at least 1"),
  endDate: z.date().optional(),
});

type FormData = z.infer<typeof schema>;

export default function DateEditDialog({
  open,
  date,
  event,
  onOpenChange,
}: Props) {
  const { events, setEvents } = useCalendar();
  const isEdit = !!event;

  const {
    control,
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title,
      startDate: event?.start || date || new Date(),
      duration: event
        ? (event.end.getTime() - event.start.getTime()) / 60000
        : 60,
      color: event?.color || "default",
      isRepeating: false,
      frequency: "Долоо хоног бүр",
      interval: 1,
      endDate: new Date(),
    },
  });

  const isRepeating = watch("isRepeating");
  const { toast } = useToast();

  const removeEvent = () => {
    if (!event) {
      return;
    }
    setEvents(events.filter((e) => e.id !== event.id));
    onOpenChange();
  };

  useEffect(() => {
    reset({
      title: event?.title,
      startDate: event?.start || date || new Date(),
      duration: event
        ? (event.end.getTime() - event.start.getTime()) / 60000
        : 60,
      color: event?.color || "default",
      isRepeating: events.filter((e) => e.title === event?.title).length > 1,
    });
  }, [event]);

  useEffect(() => {
    if (!isRepeating) {
      setValue("frequency", "Долоо хоног бүр");
      setValue("interval", 1);
      setValue("endDate", undefined);
    }
  }, [isRepeating, setValue]);

  const createEvents = (data: FormData): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    const firstEvent = {
      id: event?.id || uuid(),
      start: data.startDate,
      end: addMinutes(data.startDate, data.duration),
      title: data.title,
      color: data.color,
    };
    const eventConflicts = events.filter((e) => {
      return (
        (isBefore(firstEvent.start, e.end) &&
          isAfter(firstEvent.end, e.start)) ||
        (isBefore(e.start, firstEvent.end) && isAfter(e.end, firstEvent.start))
      );
    });
    if (eventConflicts.length > 0) {
      toast({
        title: "Error",
        description: "Хичээлийн цаг давхцаж байна",
        variant: "destructive",
      });
      return events;
    }
    events.push(firstEvent);

    if (!data.isRepeating || !data.endDate) {
      return events;
    }

    let currentDate = data.startDate;
    while (isBefore(currentDate, data.endDate)) {
      switch (data.frequency) {
        case "Өдөр бүр":
          currentDate = addDays(currentDate, data.interval);
          break;
        case "Долоо хоног бүр":
          currentDate = addWeeks(currentDate, data.interval);
          break;
        case "Сар бүр":
          currentDate = addDays(currentDate, data.interval * 30);
          break;
        default:
          break;
      }
      if (isAfter(currentDate, data.endDate)) {
        break;
      }
      const event = {
        id: uuid(),
        start: currentDate,
        end: addMinutes(currentDate, data.duration),
        title: data.title,
        color: data.color,
      };
      events.push(event);
    }
    return events;
  };

  const onSubmit = (data: FormData) => {
    const newEvents = createEvents(data);
    if (isEdit) {
      setEvents(events.filter((e) => e.id !== event.id).concat(newEvents));
    } else {
      setEvents([...events, ...newEvents]);
    }
    onOpenChange();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] px-5">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Цаг засах" : "Цаг нэмэх"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="title">Цагийн нэр</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Цагийн нэр" />
              )}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="startDate">Эхлэх цаг</Label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DateTimePicker {...field} hourCycle={24} />
              )}
            />
          </div>

          <div>
            <Label htmlFor="duration">Үргэлжлэх хугацаа (минут)</Label>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseInt(e.currentTarget.value))
                  }
                  min={5}
                  max={360}
                />
              )}
            />
            {errors.duration && (
              <p className="text-red-500 text-sm mt-2">
                {errors.duration.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="color">Өнгө</Label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {["default", "blue", "green", "pink", "purple"].map(
                      (color) => (
                        <SelectItem key={color} value={color}>
                          <span
                            className={cn(
                              monthEventVariants({ variant: color as any }),
                              "h-4 w-4 mr-2",
                            )}
                          />
                          {color}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="isRepeating"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isRepeating">Давтагдах уу?</Label>
          </div>

          {isRepeating && (
            <>
              <div>
                <Label htmlFor="frequency">Давтамж</Label>
                <Controller
                  name="frequency"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Давтамж сонгох" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Өдөр бүр", "Долоо хоног бүр", "Сар бүр"].map(
                          (freq) => (
                            <SelectItem key={freq} value={freq}>
                              {freq}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="interval">Интервал</Label>
                <Controller
                  name="interval"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.currentTarget.value))
                      }
                      type="number"
                      min={1}
                    />
                  )}
                />
                {errors.interval && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.interval.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">Дуусах огноо</Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker {...field} hourCycle={24} />
                  )}
                />
              </div>
            </>
          )}

          <DialogFooter>
            {isEdit && (
              <Button type="button" variant="destructive" onClick={removeEvent}>
                Устгах
              </Button>
            )}
            <Button type="submit">{isEdit ? "Засах" : "Нэмэх"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
