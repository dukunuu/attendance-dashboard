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
import { Upload, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { fetchCourseStudents } from "@/app/actions";
import {
  defaultColumn,
  previewTableColumns,
  tableColumns,
} from "./tableColumns";
import AddStudentDialog from "./AddStudentDialog";
import { useToast } from "@/hooks/use-toast";
import { findConflictingStudentIds, uploadCsvImagesToS3 } from "./helpers";

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
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchCourseStudents(profile.school_id).then((students) => {
      setData(students);
    });
  }, []);

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.from("students").delete().eq("id", id);
    setIsLoading(false);
    setData(data.filter((student) => student.id !== id));
  };

  const columns = tableColumns(isLoading, handleDelete, profile.role);
  const previewColumns = previewTableColumns;

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

  const previewTable = useReactTable<(typeof csvData)[number]>({
    data: csvData,
    columns: previewColumns,
    defaultColumn: defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      updateData: (rowIndex: number, columnId: number, value: any) => {
        setCsvData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              };
            }
            return row;
          }),
        );
      },
      removeRow: (rowIndex: number) => {
        setCsvData((old) => old.filter((_, index) => index !== rowIndex));
      },
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const headers = lines[0].split(",");
        const parsedData: Omit<IStudent, "id" | "school_id">[] = lines
          .slice(1)
          .map((line) => {
            const values = line.split(",");
            return {
              first_name: values[headers.indexOf("first_name")],
              last_name: values[headers.indexOf("last_name")],
              student_code: values[headers.indexOf("student_code")],
              imageUrl: values[headers.indexOf("imageUrl")],
              school_id: profile.school_id,
            };
          });
        setCsvData(parsedData);
      };
      reader.readAsText(file);
      setIsPreviewOpen(true);
    }
  };

  const handleUpload = async () => {
    setIsSubmitting(true);
    const conflictingIds = findConflictingStudentIds(data, csvData);
    if (conflictingIds.length) {
      toast({
        title: "Error",
        description: `The following student codes already exist: ${conflictingIds.join(", ")}`,
      });
      setIsSubmitting(false);
      return;
    }
    const imageUrls = (await uploadCsvImagesToS3(csvData, data)) || [];
    const studentsData = csvData.map((student, index) => ({
      ...student,
      imageUrl: imageUrls[index].length ? imageUrls[index] : student.imageUrl,
    }));
    const { data: newStudents, error } = await supabase
      .from("students")
      .upsert(studentsData)
      .select();
    if (error) {
      console.error("Error uploading students: ", error);
    }
    setData([...data, ...(newStudents || [])]);
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
              Import CSV
            </Button>
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>CSV Import Preview</DialogTitle>
                  <DialogDescription>
                    Review the data before uploading. Click upload when
                    you&apos;re ready.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-auto">
                  <Table>
                    <TableHeader>
                      {previewTable.getHeaderGroups().map((headerGroup) => (
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
                      {previewTable.getRowModel().rows?.length ? (
                        previewTable.getRowModel().rows.map((row) => (
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
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <DialogFooter>
                  <Button disabled={isSubmitting} onClick={handleUpload}>
                    {isSubmitting ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
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
