"use client";

import { supabase } from "@/lib/supabase";
import { Client } from "@/models/client";
import { TableName } from "@/models/enums/table-name";
import { Project } from "@/models/project";
import { useEffect, useState } from "react";

export const useSearchProjects = (searchValue: string) => {
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const filterClients = async (searchValue: string) => {
    setLoading(true);
    let { data, error } = await supabase
      .from(TableName.Project)
      .select("*, client(*)")
      .or(`title.ilike.%${searchValue}%`);

    if (error) {
      setLoading(false);
      return;
    }

    if (data) {
      setLoading(false);
      setFilteredProjects(data);
    }
  };

  useEffect(() => {
    filterClients(searchValue);
  }, [searchValue]);

  return { filteredProjects, searchLoading: loading };
};
