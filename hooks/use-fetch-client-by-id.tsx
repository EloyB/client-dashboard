import { supabase } from "@/lib/supabase";
import { Client } from "@/models/client";
import { TableName } from "@/models/enums/table-name";
import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { ToastAction } from "@/components/ui/toast";

export const useFetchClientById = (id: string) => {
  const { toast } = useToast();

  const [client, setClient] = useState<Client>();
  const [clientLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<PostgrestError | undefined>();
  const [errorStatus, setErrorStatus] = useState<number | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error, status } = await supabase
      .from(TableName.Client)
      .select("*, project(*)")
      .eq("id", id)
      .single();

    if (error) {
      setLoading(false);
      setError(error);
      setErrorStatus(status);
      return;
    }

    setClient(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [fetchData, id]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong.",
        description: error.details,
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }, [error]);

  const refetch = fetchData;

  return { client, clientLoading, error, refetch, errorStatus };
};
