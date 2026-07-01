import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { EmptyState } from "./empty-state";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  getRowKey?: (row: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  emptyTitle = "No data found",
  emptyDescription = "There are no records to display yet.",
  className,
  getRowKey,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="rounded-xl border border-dashed bg-card/50 py-16"
      />
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn("font-medium text-muted-foreground", column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={getRowKey?.(row, index) ?? index}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
