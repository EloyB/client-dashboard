import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

/**
 * Responsive data list: a real table from `md` up, the same rows as touchable
 * cards below it. Never scrolls horizontally on mobile (see CLAUDE.md UI rules).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  renderMobileCard,
  className,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  renderMobileCard: (row: T) => ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Card className="hidden overflow-hidden py-0 md:block">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow className="hover:bg-neutral-50">
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => (
          <div key={getRowKey(row)}>{renderMobileCard(row)}</div>
        ))}
      </div>
    </div>
  );
}
