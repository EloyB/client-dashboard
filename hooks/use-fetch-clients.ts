import { supabase } from "@/lib/supabase";
import { Client } from "@/models/client";
import { TableName } from "@/models/enums/table-name";
import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export const useFetchClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<PostgrestError | undefined>();

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(TableName.Client)
      .select("*, project(*)");

    if (error) {
      setError(error);
      return;
    }

    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, []);

  return { clients, clientLoading, error, refetch };
};
