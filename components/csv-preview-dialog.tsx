import { LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { defaultColumn, previewTableColumns } from "./students/tableColumns";

type Props = {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  csvData: Omit<IStudent, "id" | "school_id">[];
  setCsvData: React.Dispatch<
    React.SetStateAction<Omit<IStudent, "id" | "school_id">[]>
  >;
  isSubmitting: boolean;
  handleUpload: () => Promise<void>;
};

export default function CSVPreviewDialog({
  isPreviewOpen,
  setIsPreviewOpen,
  csvData,
  setCsvData,
  isSubmitting,
  handleUpload,
}: Props) {
  const previewColumns = previewTableColumns;
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
  return (
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>CSV Import Preview</DialogTitle>
          <DialogDescription>
            Review the data before uploading. Click upload when you&apos;re
            ready.
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
                    colSpan={previewColumns.length}
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
  );
}
