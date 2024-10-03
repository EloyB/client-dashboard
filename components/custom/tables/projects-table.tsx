import { projectsTabelHeaders } from "@/lib/constants";
import { Project, ProjectKeys } from "@/models/project";
import { ChevronRight } from "lucide-react";
import { TableCell, TableRow } from "../../ui/table";
import ProjectStatusBadge from "../badges/project-status-badge";
import DefaultTableCell from "./default-table-cell";
import DynamicTable from "./dynamic-table";
import moment from "moment";

interface ProjectsTableProps {
  projects: Project[];
}

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  return (
    <DynamicTable headers={[...projectsTabelHeaders, { key: "", label: "" }]}>
      {projects.map((project, index) => (
        <TableRow key={index} className="group cursor-pointer">
          {projectsTabelHeaders.map(({ key }, index) => {
            switch (key) {
              case ProjectKeys.Title:
                return (
                  <TableCell
                    key={index}
                    width={150}
                    className="overflow-hidden truncate font-semibold"
                  >
                    {project.title}
                  </TableCell>
                );

              case ProjectKeys.Status:
                return (
                  <TableCell key={index} width={150}>
                    <ProjectStatusBadge projectStatus={project.status} />
                  </TableCell>
                );

              case ProjectKeys.ClientId:
                return (
                  <TableCell key={index}>{project.client?.name}</TableCell>
                );

              case ProjectKeys.CreatedOn:
                return (
                  <TableCell key={index} width={150}>
                    {moment(project.createdOn).format("DD/MM/YYYY")}
                  </TableCell>
                );

              default:
                return <DefaultTableCell key={index} data={project[key]} />;
            }
          })}
          <TableCell width={20}>
            <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-gray-400" />
          </TableCell>
        </TableRow>
      ))}
    </DynamicTable>
  );
};

export default ProjectsTable;
