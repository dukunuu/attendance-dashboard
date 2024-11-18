import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { ArrowUpDown, Ellipsis, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import React, { useState } from "react";
import { Input } from "../ui/input";

export const tableColumns = (
  isLoading: boolean,
  handleDelete: Function,
  role: "teacher" | "admin" | "school_admin",
): ColumnDef<IStudent>[] => {
  const columns: ColumnDef<IStudent>[] = [
    {
      accessorKey: "student_code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Student Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <Link href={`/students/${row.original.id}`}>
            <Button variant={"link"}>{row.getValue("student_code")}</Button>
          </Link>
        );
      },
    },
    {
      accessorKey: "first_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("first_name")}</div>,
    },
    {
      accessorKey: "last_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("last_name")}</div>,
    },
    {
      accessorKey: "imageUrl",
      header: "Image Preview",
      cell: ({ row }) => (
        <img
          src={row.getValue("imageUrl")}
          alt={`Preview of ${row.getValue("first_name")}`}
          className="w-16 h-16 object-cover rounded"
        />
      ),
    },
  ];
  if (role !== "teacher") {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/students/${student.id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the student&apos;s data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(student.id)}>
                      {isLoading ? (
                        <Ellipsis className="animate-puls" />
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }
  return columns;
};

export const defaultColumn: Partial<
  ColumnDef<Omit<IStudent, "id" | "school_id">>
> = {
  cell: ({ getValue, row: { index }, column: { id }, table }) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    const [isEditing, setIsEditing] = useState(false);

    const onBlur = () => {
      table.options.meta?.updateData(index, id, value);
      setIsEditing(false);
    };

    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    if (isEditing) {
      return (
        <Input
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          autoFocus
        />
      );
    }

    return (
      <div onDoubleClick={() => setIsEditing(true)}>{value as string}</div>
    );
  },
};

export const previewTableColumns: ColumnDef<
  Omit<IStudent, "id" | "school_id">
>[] = [
    {
      accessorKey: "student_code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Student Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "first_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "last_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "imageUrl",
      header: "Image Preview",
      cell: ({ row }) => (
        <img
          src={row.getValue("imageUrl")}
          alt={`Preview of ${row.getValue("first_name")}`}
          className="w-16 h-16 object-cover rounded"
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row, table }) => {
        const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          table.options.meta?.removeRow(row.index);
        };
        return (
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={handleRemove}>
            <Trash2 />
          </Button>
        );
      },
    },
  ];
