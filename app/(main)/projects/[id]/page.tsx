"use client";

import ProjectStatusBadge from "@/components/custom/badges/project-status-badge";
import ProjectLinkButtonsGroup from "@/components/custom/buttons/project-link-buttons-group";
import TimelineCardsOverview from "@/components/custom/cards/timeline-cards-overview";
import Loader from "@/components/custom/loaders/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFetchProjectById } from "@/hooks/use-fetch-project-by-id";
import { generateDefaultTimelineItems } from "@/lib/utils";
import { createDefaultTimelineItems } from "@/services/timeline-items-service";
import {
  CalendarDays,
  ChevronRight,
  Contact,
  File,
  PackageOpen,
  TriangleAlert,
} from "lucide-react";

const ProjectDetailPage = ({ params }: { params: { id: string } }) => {
  const { project, projectLoading, error, refetch, errorStatus } =
    useFetchProjectById(params.id);

  if (projectLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center space-x-4 p-8">
        <TriangleAlert />
        <h3 className="text-2xl">{errorStatus}</h3>
      </div>
    );
  }

  if (!project) {
    return <div>No client found!</div>;
  }

  const handleGenerateDefaultTimeline = async () => {
    await createDefaultTimelineItems(project.id).then(() => refetch());
  };

  return (
    <div>
      <div className="flex items-center justify-between pb-16">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{project.title}</h1>
          <div className="flex items-center space-x-2">
            <Badge variant={"gray"} className="space-x-2">
              <Contact className="h-4 w-4" />
              <span>{project.client.name}</span>
            </Badge>
            <ProjectStatusBadge projectStatus={project.status} />
          </div>
        </div>
        <ProjectLinkButtonsGroup project={project} />
      </div>
      <div className="mb-16">
        <div className="flex items-center justify-between">
          <h3 className="mb-4 text-2xl font-semibold">Timeline</h3>
          {project.timelineItems.length > 0 && (
            <Button variant={"link"}>
              <span>Show full timeline</span>
              <ChevronRight />
            </Button>
          )}
        </div>
        {project.timelineItems.length > 0 ? (
          <TimelineCardsOverview timelineItems={project.timelineItems} />
        ) : (
          <div className="flex w-full flex-col items-center justify-center space-y-4 rounded-md border py-16">
            <p className="text-2xl text-gray-400">
              No timeline set for this project
            </p>
            <div className="flex items-center space-x-4">
              <Button>
                <CalendarDays />
                Create custom timeline
              </Button>
              <Button
                variant={"outline"}
                onClick={() => handleGenerateDefaultTimeline()}
              >
                <PackageOpen />
                Create default timeline
              </Button>
            </div>
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h3 className="mb-4 text-2xl font-semibold">Documents</h3>
        </div>
        <div className="grid grid-cols-4">
          <div className="flex items-center space-x-4 rounded-md border p-6">
            <File />
            <div>
              <h4 className="text-xl font-semibold">Document name</h4>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-400">12/12/2021</p>
                <span className="text-xs text-gray-400">•</span>
                <p className="text-sm text-gray-400">Quote</p>
                <span className="text-xs text-gray-400">•</span>
                <p className="text-sm text-gray-400">1.4MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
