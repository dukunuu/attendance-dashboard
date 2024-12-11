"use client";

import { useState, useEffect, useRef } from "react";
import {
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addStudentToCourse,
  deleteCourseStudent,
  fetchCourseStudents,
} from "@/app/actions";
import { tableColumns } from "./tableColumns";
import AddStudentDialog from "../add-student-dialog";
import { Loader2, UploadIcon } from "lucide-react";
import CSVPreviewDialog from "../csv-preview-dialog";
import { handleFileChange } from "../students/helpers";
import { useToast } from "@/hooks/use-toast";

export default function StudentsDataTable({
  profile,
  courseId,
}: {
  profile: User;
  courseId: string;
}) {
  const [data, setData] = useState<IStudent[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [csvData, setCsvData] = useState<Omit<IStudent, "id" | "school_id">[]>(
    [],
  );
  const [isSubmitting, setIsSubmittin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const error = await deleteCourseStudent({
      p_student_code: id,
      p_course_id: Number.parseInt(courseId),
    });
    setIsLoading(false);
    if (error) {
      toast({
        title: "Алдаа",
        description: "Устгахад алдаа гарлаа: " + error.message,
        variant: "destructive",
      });
    }
    setData(data.filter((student) => student.student_code !== id));
  };

  const columns = tableColumns(isLoading, handleDelete);

  const table = useReactTable({
    data,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const csvStudents = await handleFileChange(event);
    if (csvStudents) {
      setIsPreviewOpen(true);
      setCsvData(csvStudents);
      return;
    }
    toast({
      title: "Error",
      description: "Invalid CSV file.",
    });
  };

  const handleUpload = async () => {
    setIsSubmittin(true);
    await addStudents(csvData as IStudent[]);
    setCsvData([]);
    setIsPreviewOpen(false);
    setIsSubmittin(false);
  };

  const addStudents = async (students: IStudent[]) => {
    const error = await addStudentToCourse(
      Number.parseInt(courseId),
      students,
      profile.school_id,
    );
    if (error)
      toast({
        variant: "destructive",
        title: "Алдаа гарлаа",
        description: error.message,
      });
    setData((prev) => {
      const prevSet = new Set(prev.map((el) => el.student_code));
      const newStudents = students.filter(
        (el) => !prevSet.has(el.student_code),
      );
      return [...prev, ...newStudents];
    });
    toast({
      title: "Success",
      description: "Сурагчдыг амжилттай нэмлээ.",
    });
  };

  useEffect(() => {
    setStudentsLoading(true);
    fetchCourseStudents(profile.school_id, courseId).then((students) => {
      setData(students);
      setStudentsLoading(false);
    });
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center gap-y-2 justify-between py-4">
        <Input
          placeholder="Сурагч хайх..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.click();
              }
            }}
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            CSV оруулах
          </Button>
          <CSVPreviewDialog
            isPreviewOpen={isPreviewOpen}
            setIsPreviewOpen={setIsPreviewOpen}
            csvData={csvData}
            setCsvData={setCsvData}
            isSubmitting={isSubmitting}
            handleUpload={handleUpload}
          />
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <AddStudentDialog
            schoolId={profile.school_id}
            courseId={Number.parseInt(courseId)}
            addStudentsAction={addStudents}
            addTo="course"
          />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="w-full">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center  w-full"
                >
                  {studentsLoading ? (
                    <div className="w-full h-full flex justify-center items-center">
                      <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                  ) : (
                    "Сурагч олдсонгүй"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Өмнөх
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Дараах
          </Button>
        </div>
      </div>
    </div>
  );
}
