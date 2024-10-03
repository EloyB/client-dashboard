import { TableCell } from "@/components/ui/table";
import React from "react";
import moment from "moment";

interface DefaultTableCellProps {
  data: any;
}

const DefaultTableCell = ({ data }: DefaultTableCellProps) => {
  if (data instanceof Date) {
    return <TableCell>{moment(data).format("l")}</TableCell>;
  }

  return <TableCell>{data ?? "-"}</TableCell>;
};

export default DefaultTableCell;
