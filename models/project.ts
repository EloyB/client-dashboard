import { BaseType } from "./base-type";
import { Client } from "./client";
import { DefaultTableKeys } from "./enums/default-table-keys";
import { ProjectStatus } from "./enums/project-status";
import { TimelineItem } from "./timeline-item";

export interface Project extends BaseType {
  id: string;
  title: string;
  clientId: string; //FK to Client
  designUri: string;
  testUri: string;
  productionUri: string;
  backofficeUri: string;
  vercelUri: string;
  status: ProjectStatus;
  repositoryUri: string;
  client: Client;
  timelineItems: TimelineItem[];
}

export const ProjectKeys = {
  Id: "id",
  Title: "title",
  ClientId: "clientId",
  DesignUri: "designUri",
  TestUri: "testUri",
  ProductionUri: "productionUri",
  BackofficeUri: "backofficeUri",
  VercelUri: "vercelUri",
  Status: "status",
  RepositoryUri: "repositoryUri",
  ...DefaultTableKeys,
};
