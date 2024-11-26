"use client";

import { ToastAction } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { TableName } from "@/models/enums/table-name";
import { Project } from "@/models/project";
import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "./use-toast";

export const useFetchProjectById = (id: string) => {
  const { toast } = useToast();

  const [project, setProject] = useState<Project>();
  const [projectLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<PostgrestError | undefined>();
  const [errorStatus, setErrorStatus] = useState<number | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error, status } = await supabase
      .from(TableName.Project)
      .select("*, client(*), timeline_item(*)")
      .eq("id", id)
      .single();

    if (error) {
      setLoading(false);
      setError(error);
      setErrorStatus(status);
      return;
    }
    setProject({ ...data, timelineItems: data.timeline_item });
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

  return { project, projectLoading, error, refetch, errorStatus };
};
