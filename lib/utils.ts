import { TimelineStatus } from "@/models/enums/timeline-status";
import { TimelineItem } from "@/models/timeline-item";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateDefaultTimelineItems(
  projectId: string,
): Partial<TimelineItem>[] {
  const twoWeeks = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

  return [
    {
      projectId,
      title: "Startup",
      description:
        "In this phase we have meetings about the needs of the client and make sure all of the paperwork is done and all agreements are set.",
      startDate: new Date(),
      dueDate: new Date(Date.now() + twoWeeks),
      status: TimelineStatus.NotStarted,
    },
    {
      projectId,
      title: "Design",
      description:
        "In this phase we start designing the project. This happens in multiple iterations and meetings with the client.",
      startDate: new Date(Date.now() + twoWeeks),
      dueDate: new Date(Date.now() + 2 * twoWeeks),
      status: TimelineStatus.NotStarted,
    },
    {
      projectId,
      title: "Development",
      description:
        "In this phase we start developing the project. We start writing the code and make sure everything is working as expected.",
      startDate: new Date(Date.now() + 2 * twoWeeks),
      dueDate: new Date(Date.now() + 3 * twoWeeks),
      status: TimelineStatus.NotStarted,
    },
    {
      projectId,
      title: "Testing",
      description:
        "In this phase we start testing the project. We make sure everything is working as expected and we fix any bugs that we find.",
      startDate: new Date(Date.now() + 3 * twoWeeks),
      dueDate: new Date(Date.now() + 4 * twoWeeks),
      status: TimelineStatus.NotStarted,
    },
    {
      projectId,
      title: "Waiting for payment",
      description:
        "The project is done and we are waiting for the client to pay the last invoice.",
      startDate: new Date(Date.now() + 4 * twoWeeks),
      dueDate: new Date(Date.now() + 5 * twoWeeks),
      status: TimelineStatus.NotStarted,
    },
    {
      projectId,
      title: "Deployment",
      description:
        "The project has been completed and will be deployed to the production environment.",
      startDate: new Date(Date.now() + 5 * twoWeeks),
      dueDate: new Date(Date.now() + 6 * twoWeeks),
      status: TimelineStatus.NotStarted,
    },
  ];
}
