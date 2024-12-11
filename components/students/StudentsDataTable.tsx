"use client";

import { useState, useRef, useEffect } from "react";
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
import { Upload } from "lucide-react";
import {
  addStudents,
  deleteStudentById,
  fetchCourseStudents,
} from "@/app/actions";
import { tableColumns } from "./tableColumns";
import AddStudentDialog from "./AddStudentDialog";
import { useToast } from "@/hooks/use-toast";
import {
  findConflictingStudentIds,
  handleFileChange,
  uploadCsvImagesToS3,
} from "./helpers";
import CSVPreviewDialog from "../csv-preview-dialog";
import { ToastAction } from "../ui/toast";
import { isPostgressError } from "@/app/(protected)/helper";

export default function StudentsDataTable({ profile }: { profile: User }) {
  const [data, setData] = useState<IStudent[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [csvData, setCsvData] = useState<Omit<IStudent, "id" | "school_id">[]>(
    [],
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourseStudents(profile.school_id).then((students) => {
      setData(students);
    });
  }, []);

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    const error = await deleteStudentById(id);
    if (error) {
      console.error("Error deleting student: ", error);
      toast({
        title: "Алдаа",
        description: "Сурагч устгахад алдаа гарлаа: " + error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    setData(data.filter((student) => student.id !== id));
  };

  const columns = tableColumns(isLoading, handleDelete, profile.role);

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

  const removeConflictingIds = (conflictingIds: string[]) => {
    setCsvData((old) =>
      old.filter((student) => !conflictingIds.includes(student.student_code)),
    );
  };

  const handleUpload = async () => {
    setIsSubmitting(true);
    const conflictingIds = findConflictingStudentIds(data, csvData);
    if (conflictingIds.length) {
      toast({
        title: "Error",
        description: `The following student codes already exist: ${conflictingIds.length < 5 ? conflictingIds.join(", ") : conflictingIds.slice(0, 5).join(", ") + "..."}`,
        action: (
          <ToastAction
            onClick={() => removeConflictingIds(conflictingIds)}
            altText="Эдгээр оюутнуудыг орхих?"
          >
            Орхих
          </ToastAction>
        ),
      });
      setIsSubmitting(false);
      return;
    }
    const imageUrls = await uploadCsvImagesToS3(csvData, data);
    const studentsData: Omit<IStudent, "id">[] = csvData.map(
      (student, index) => ({
        ...student,
        school_id: profile.school_id,
        first_name: student.first_name.toUpperCase().trim(),
        last_name: student.last_name.toUpperCase().trim(),
        student_code: student.student_code.toUpperCase().trim(),
        imageUrl: imageUrls[index] ? imageUrls[index] : student.imageUrl,
      }),
    );
    const newStudents = await addStudents(studentsData);

    if (isPostgressError(newStudents)) {
      console.error("Error uploading students: ", newStudents);
      toast({
        title: "Алдаа",
        description: "Сурагчид нэмэхэд алдаа гарлаа: " + newStudents.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
    setData([...data, ...((newStudents as IStudent[]) || [])]);
    setCsvData([]);
    setIsPreviewOpen(false);
    setIsSubmitting(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter by student code..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        {profile.role !== "teacher" && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              CSV оруулах
            </Button>
            <CSVPreviewDialog
              isPreviewOpen={isPreviewOpen}
              setIsPreviewOpen={setIsPreviewOpen}
              csvData={csvData}
              setCsvData={setCsvData}
              handleUpload={handleUpload}
              isSubmitting={isSubmitting}
            />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              ref={fileInputRef}
            />
            <AddStudentDialog />
          </div>
        )}
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
                  className="h-24 text-center w-full"
                >
                  No results.
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
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
