"use client";

import { supabase } from "@/lib/supabase";
import { Client } from "@/models/client";
import { TableName } from "@/models/enums/table-name";
import { useEffect, useState } from "react";

export const useSearchClient = (searchValue: string) => {
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const filterClients = async (searchValue: string) => {
    setLoading(true);
    let { data, error } = await supabase
      .from(TableName.Client)
      .select("*, project(*)")
      .or(
        `name.ilike.%${searchValue}%,email.ilike.%${searchValue}%,phone.ilike.%${searchValue}%,address.ilike.%${searchValue}%,vatNumber.ilike.%${searchValue}%`,
      );

    if (error) {
      setLoading(false);
      return;
    }

    if (data) {
      setLoading(false);
      setFilteredClients(data);
    }
  };

  useEffect(() => {
    filterClients(searchValue);
  }, [searchValue]);

  return { filteredClients, searchLoading: loading };
};
