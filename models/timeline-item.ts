import { BaseType } from "./base-type";
import { TimelineStatus } from "./enums/timeline-status";

export interface TimelineItem extends BaseType {
  id: string;
  projectId: string; //FK to Project
  title: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  createdAt: Date;
  status: TimelineStatus;
}
