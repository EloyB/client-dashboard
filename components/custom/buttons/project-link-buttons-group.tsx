import { Button } from "@/components/ui/button";
import { Project } from "@/models/project";
import { TestTube, Rocket, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { FaGithub } from "react-icons/fa";
import { FiFigma } from "react-icons/fi";
import { SiVercel } from "react-icons/si";

interface ProjectLinkButtonsGroupProps {
  project: Project;
}

const ProjectLinkButtonsGroup = ({ project }: ProjectLinkButtonsGroupProps) => {
  const router = useRouter();

  const openUri = (uri: string) => {
    router.push(uri);
  };

  return (
    <div className="flex items-center space-x-2">
      {project.repositoryUri && (
        <Button
          onClick={() => openUri(project.repositoryUri)}
          size={"icon"}
          variant={"outline"}
        >
          <FaGithub />
        </Button>
      )}
      {project.designUri && (
        <Button
          onClick={() => openUri(project.designUri)}
          size={"icon"}
          variant={"outline"}
        >
          <FiFigma />
        </Button>
      )}
      {project.testUri && (
        <Button
          onClick={() => openUri(project.testUri)}
          size={"icon"}
          variant={"outline"}
        >
          <TestTube />
        </Button>
      )}
      {project.productionUri && (
        <Button
          onClick={() => openUri(project.productionUri)}
          size={"icon"}
          variant={"outline"}
        >
          <Rocket />
        </Button>
      )}
      {project.backofficeUri && (
        <Button
          onClick={() => openUri(project.backofficeUri)}
          size={"icon"}
          variant={"outline"}
        >
          <LayoutDashboard />
        </Button>
      )}
      {project.vercelUri && (
        <Button
          onClick={() => openUri(project.vercelUri)}
          size={"icon"}
          variant={"outline"}
        >
          <SiVercel />
        </Button>
      )}
    </div>
  );
};

export default ProjectLinkButtonsGroup;
