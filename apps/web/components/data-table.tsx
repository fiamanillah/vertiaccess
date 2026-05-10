'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination";

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  totalRows: number;
  totalPages: number;
  pagination: { pageIndex: number; pageSize: number };
  onPaginationChange: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
  isLoading?: boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  totalPages,
  pagination,
  onPaginationChange,
  isLoading,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: { pagination },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        onPaginationChange(updater(pagination));
      } else {
        onPaginationChange(updater);
      }
    },
  });

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, pagination.pageIndex - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    if (startPage > 0) {
      items.push(
        <PaginationItem key="start">
          <PaginationLink onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 1) {
        items.push(<PaginationItem key="ellipsis-start"><PaginationEllipsis /></PaginationItem>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={pagination.pageIndex === i}
            onClick={() => onPaginationChange({ ...pagination, pageIndex: i })}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        items.push(<PaginationItem key="ellipsis-end"><PaginationEllipsis /></PaginationItem>);
      }
      items.push(
        <PaginationItem key="end">
          <PaginationLink onClick={() => onPaginationChange({ ...pagination, pageIndex: totalPages - 1 })}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing page {pagination.pageIndex + 1} of {totalPages}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 order-1 sm:order-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm whitespace-nowrap">
              Rows per page
            </Label>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(v) =>
                onPaginationChange({ ...pagination, pageSize: +v, pageIndex: 0 })
              }>
              <SelectTrigger className="w-20">
                <SelectValue placeholder={pagination.pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20, 25, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPaginationChange({ ...pagination, pageIndex: Math.max(0, pagination.pageIndex - 1) })}
                  className={pagination.pageIndex === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              <div className="hidden md:flex">
                {renderPaginationItems()}
              </div>

              <PaginationItem>
                <PaginationNext
                  onClick={() => onPaginationChange({ ...pagination, pageIndex: Math.min(totalPages - 1, pagination.pageIndex + 1) })}
                  className={pagination.pageIndex >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
