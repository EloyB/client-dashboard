import { ReactElement } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Header } from "@/models/table-header";
import { Card } from "../../ui/card";

interface DynamicTableProps<T> {
  headers: Header<T>[];
  children: ReactElement[];
}

const DynamicTable = <T extends object>({
  headers,
  children,
}: DynamicTableProps<T>) => {
  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index}>{header.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </Card>
  );
};

export default DynamicTable;
