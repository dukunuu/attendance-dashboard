"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface LessonData {
  attendance_date: string;
  present_count: number;
  student_count: number;
}

export default function SingleLessonProgressChart({
  lessonData,
}: {
  lessonData: LessonData;
}) {
  const attendancePercentage =
    (lessonData.present_count / lessonData.student_count) * 100;
  const formattedDate = new Date(lessonData.attendance_date).toLocaleDateString(
    "mn-MN",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const chartData = [
    {
      label: "Ирсэн",
      value: lessonData.present_count,
    },
    {
      label: "Ирээгүй",
      value: lessonData.student_count - lessonData.present_count,
    },
  ];

  return (
    <Card className="w-full inline-block mr-5 max-w-xs md:max-w-sm">
      <CardHeader>
        <CardDescription>Огноо: {formattedDate}</CardDescription>
      </CardHeader>
      <CardContent className="md:space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Ирц</span>
            <span className="text-sm text-muted-foreground">
              {lessonData.present_count} / {lessonData.student_count}
            </span>
          </div>
          <Progress value={attendancePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {attendancePercentage.toFixed(1)}% ирцтэй
          </p>
        </div>

        <ChartContainer
          config={{
            value: {
              label: "Students",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="md:h-[200px] h-[150px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="label" width={80} />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[0, 4, 4, 0]}
                label={{ position: "right", fill: "hsl(var(--foreground))" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
