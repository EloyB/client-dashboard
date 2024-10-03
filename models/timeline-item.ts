import { BaseType } from "./base-type";
import { TimelineItemCategory } from "./enums/timeline-item-category";

export interface TimelineItem extends BaseType {
  id: string;
  projectId: string; //FK to Project
  title: string;
  description: string;
  category: TimelineItemCategory;
}
