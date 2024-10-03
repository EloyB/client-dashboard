"use client";

import Loader from "@/components/custom/loaders/loader";
import ProjectsTable from "@/components/custom/tables/projects-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import useDebouncedInput from "@/hooks/use-debounce-input";
import { useFetchProjects } from "@/hooks/use-fetch-projects";
import { useSearchClient } from "@/hooks/use-search-clients";
import { useSearchProjects } from "@/hooks/use-search-projects";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const Projects = () => {
  const searchParams = useSearchParams();

  const { projects, projectsLoading } = useFetchProjects();
  const searchInput = useDebouncedInput("", 500);
  const { filteredProjects, searchLoading } = useSearchProjects(
    searchParams.get("searchValue")
      ? searchParams.get("searchValue")!
      : searchInput.debouncedValue,
  );

  useEffect(() => {
    const searchValue = searchParams.get("searchValue");
    if (searchValue) {
      searchInput.setValue(searchValue);
    }
  }, []);

  if (projectsLoading) {
    return <Loader />;
  }

  return (
    <div className="max-w-screen-2xl space-y-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-4xl font-bold">Projects</h1>
          <Badge variant={"gray"}>{projects.length}</Badge>
        </div>
        {/* <CreateClientDialog onClose={() => refetch()}>
          <Button className="space-x-2">
            <PlusIcon />
            <span>Create new client</span>
          </Button>
        </CreateClientDialog> */}
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4" />
          <Input
            value={searchInput.value}
            onChange={(e) => searchInput.setValue(e.target.value)}
            className="w-[300px]"
            placeholder="Search a project"
          />
          {searchLoading && <Loader />}
        </div>
        <ProjectsTable
          projects={
            searchInput.debouncedValue.length ? filteredProjects : projects
          }
        />
      </div>
    </div>
  );
};

export default Projects;
