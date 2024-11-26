import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@/models/project";
import { PanelsTopLeft, Rocket, TestTube } from "lucide-react";
import moment from "moment";
import { FiFigma, FiGithub } from "react-icons/fi";
import { SiVercel } from "react-icons/si";
import ProjectStatusBadge from "../badges/project-status-badge";
import { useRouter } from "next/navigation";

interface ClientProjectCardProps {
  project: Project;
}

const ClientProjectCard = ({ project }: ClientProjectCardProps) => {
  const router = useRouter();

  const handleUriClick = (uri: string) => {
    window.open(uri, "_blank");
  };

  return (
    <Card
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <PanelsTopLeft />
          <ProjectStatusBadge projectStatus={project.status} />
        </div>
        <div>
          <h4 className="text-xl font-semibold">{project.title}</h4>
          <p className="text-gray-400">
            {moment(project.createdOn).format("DD/MM/YYYY")}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {project.repositoryUri && (
            <FiGithub
              className="h-4 w-4 cursor-pointer"
              onClick={() => handleUriClick(project.repositoryUri)}
            />
          )}
          {project.designUri && (
            <FiFigma
              className="h-4 w-4 cursor-pointer"
              onClick={() => handleUriClick(project.repositoryUri)}
            />
          )}
          {project.vercelUri && (
            <SiVercel
              className="h-4 w-4 cursor-pointer"
              onClick={() => handleUriClick(project.repositoryUri)}
            />
          )}
          {project.testUri && (
            <TestTube
              className="h-4 w-4 cursor-pointer"
              onClick={() => handleUriClick(project.testUri)}
            />
          )}
          {project.productionUri && (
            <Rocket
              className="h-4 w-4 cursor-pointer"
              onClick={() => handleUriClick(project.productionUri)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientProjectCard;
