"use client";

import CreateClientDialog from "@/components/custom/dialogs/create-client-dialog";
import Loader from "@/components/custom/loaders/loader";
import ClientsTable from "@/components/custom/tables/clients-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useDebouncedInput from "@/hooks/use-debounce-input";
import { useFetchClients } from "@/hooks/use-fetch-clients";
import { useSearchClient } from "@/hooks/use-search-clients";
import { PlusIcon, Search, TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const Clients = () => {
  const searchParams = useSearchParams();

  const { clients, clientLoading, error, refetch } = useFetchClients();
  const searchInput = useDebouncedInput("", 500);
  const { filteredClients, searchLoading } = useSearchClient(
    searchInput.debouncedValue,
  );

  useEffect(() => {
    const searchValue = searchParams.get("searchValue");
    if (searchValue) {
      searchInput.setValue(searchValue);
    }
  }, []);

  if (clientLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    <div className="flex h-full w-full items-center justify-center p-8">
      <TriangleAlert />
    </div>;
  }

  return (
    <div className="max-w-screen-2xl space-y-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-4xl font-bold">Clients</h1>
          <Badge variant={"gray"}>{clients.length}</Badge>
        </div>
        <CreateClientDialog onClose={() => refetch()}>
          <Button className="space-x-2">
            <PlusIcon />
            <span>Create new client</span>
          </Button>
        </CreateClientDialog>
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4" />
          <Input
            value={searchInput.value}
            onChange={(e) => searchInput.setValue(e.target.value)}
            className="w-[300px]"
            placeholder="Search a client"
          />
          {searchLoading && <Loader />}
        </div>
        <ClientsTable
          clients={
            searchInput.debouncedValue.length ? filteredClients : clients
          }
        />
      </div>
    </div>
  );
};

export default Clients;
