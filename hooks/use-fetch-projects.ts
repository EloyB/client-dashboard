import { supabase } from "@/lib/supabase";
import { Client } from "@/models/client";
import { TableName } from "@/models/enums/table-name";
import { Project } from "@/models/project";
import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export const useFetchProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<PostgrestError | undefined>();

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(TableName.Project)
      .select("*, client(*)");

    if (error) {
      setError(error);
      return;
    }

    console.log(data);
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, []);

  return { projects, projectsLoading, error, refetch };
};
