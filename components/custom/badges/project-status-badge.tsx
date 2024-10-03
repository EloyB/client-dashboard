import { ProjectStatus } from "@/models/enums/project-status";
import React from "react";
import { Badge } from "../../ui/badge";

interface ProjectStatusBadgeProps {
  projectStatus: ProjectStatus;
}

const ProjectStatusBadge = ({ projectStatus }: ProjectStatusBadgeProps) => {
  switch (projectStatus) {
    case ProjectStatus.NotStarted:
      return <Badge variant={"gray"}>Not Started</Badge>;
    case ProjectStatus.Planning:
      return <Badge variant={"yellow"}>Planning</Badge>;
    case ProjectStatus.Designing:
      return <Badge variant={"info"}>Designing</Badge>;
    case ProjectStatus.InDevelopment:
      return <Badge variant={"warning"}>In Development</Badge>;
    case ProjectStatus.InTest:
      return <Badge variant={"purple"}>Testing</Badge>;
    case ProjectStatus.Deployed:
      return <Badge variant={"positive"}>Deployed</Badge>;

    default:
      return <Badge>{projectStatus}</Badge>;
  }
};

export default ProjectStatusBadge;
