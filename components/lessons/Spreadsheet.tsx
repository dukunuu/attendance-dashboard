"use client";

import React, { useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseISO, format, compareAsc } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SpreadsheetProps {
  students: IStudent[];
  onEdit: (studentCode: number, date: string, present: boolean) => void;
  onDelete: (studentId: number) => void;
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({
  students,
  onEdit,
  onDelete,
}) => {
  const attendanceDates = useMemo(() => {
    const allDates = students.flatMap((student) =>
      student.attendance_data!.map((ad) => ad.date),
    );
    return Array.from(new Set(allDates)).sort((a, b) =>
      compareAsc(parseISO(a), parseISO(b)),
    );
  }, [students]);

  const handleToggleAttendance = (
    studentCode: number,
    date: string,
    present: boolean,
  ) => {
    onEdit(studentCode, date, present);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MM/dd");
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Оюутны код</TableHead>
            <TableHead>Нэр</TableHead>
            {attendanceDates.map((date) => (
              <TableHead key={date} className="text-center">
                {formatDate(date)}
              </TableHead>
            ))}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.student_code}>
              <TableCell>{student.student_code}</TableCell>
              <TableCell>{`${student.last_name.at(0)}.${student.first_name}`}</TableCell>
              {attendanceDates.map((date) => {
                const attendanceRecord = student.attendance_data?.find(
                  (ad) => ad.date === date,
                );
                return (
                  <TableCell key={date} className="text-center">
                    <Switch
                      checked={attendanceRecord?.present || false}
                      onCheckedChange={(checked) =>
                        handleToggleAttendance(student.id, date, checked)
                      }
                    />
                  </TableCell>
                );
              })}
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(student.id)}
                  aria-label={`Delete ${student.first_name} ${student.last_name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Spreadsheet;
