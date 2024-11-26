import { clientsTableHeaders } from "@/lib/constants";
import { Client, ClientKeys } from "@/models/client";
import { ChevronRight } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "../../ui/table";
import DefaultTableCell from "./default-table-cell";
import DynamicTable from "./dynamic-table";

interface ClientsTableProps {
  clients: Client[];
}

const ClientsTable = ({ clients }: ClientsTableProps) => {
  const router = useRouter();

  if (clients.length === 0) {
    return <div className="rounded-lg border p-4">No clients found</div>;
  }

  return (
    <DynamicTable headers={[...clientsTableHeaders, { key: "", label: "" }]}>
      {clients.map((client, index) => (
        <TableRow
          key={index}
          className="group cursor-pointer"
          onClick={() => router.push(`/clients/${client.id}`)}
        >
          {clientsTableHeaders.map(({ key }, index) => {
            switch (key) {
              case ClientKeys.Name:
                return (
                  <TableCell
                    key={index}
                    width={150}
                    className="overflow-hidden truncate font-semibold"
                  >
                    {client.name}
                  </TableCell>
                );
              case ClientKeys.CreatedOn:
                return (
                  <TableCell key={index} width={150}>
                    {moment(client.createdOn).format("DD/MM/YYYY")}
                  </TableCell>
                );

              default:
                return <DefaultTableCell key={index} data={client[key]} />;
            }
          })}
          <TableCell>
            <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-gray-400" />
          </TableCell>
        </TableRow>
      ))}
    </DynamicTable>
  );
};

export default ClientsTable;
