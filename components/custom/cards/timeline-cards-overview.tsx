import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineItem } from "@/models/timeline-item";
import {
  Circle,
  CircleCheck,
  Clock,
  Ellipsis,
  Plus,
  Trash,
} from "lucide-react";
import moment from "moment";
import React from "react";

interface TimelineCardsOverviewProps {
  timelineItems: TimelineItem[];
}

const TimelineCardsOverview = ({
  timelineItems,
}: TimelineCardsOverviewProps) => {
  return (
    <div className="grid w-full grid-cols-4 gap-8">
      {timelineItems.slice(0, 4).map((timelineItem, index) => (
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle>{timelineItem.title}</CardTitle>
                <p className="text-sm text-gray-400">
                  {moment(timelineItem.startDate).format("DD/MM/YYYY")} -{" "}
                  {moment(timelineItem.dueDate).format("DD/MM/YYYY")}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"outline"} size={"icon"}>
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-4">
                  <DropdownMenuItem className="cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Add new task</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-red-400 focus:bg-red-50 focus:text-red-400">
                    <Trash className="h-4 w-4" />
                    <span>Remove timeline item</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex cursor-pointer items-center space-x-4 rounded-md p-2 hover:bg-gray-50">
                <CircleCheck className="text-green-400" />
                <div>
                  <span>Iteration 1</span>
                  <p className="text-sm text-gray-400">
                    {moment(timelineItem.dueDate).format("DD/MM/YYYY")}
                  </p>
                </div>
              </li>
              <li className="flex cursor-pointer items-center space-x-4 rounded-md p-2 hover:bg-gray-50">
                <Clock className="text-gray-500" />
                <div>
                  <span>Iteration 1</span>
                  <p className="text-sm text-gray-400">
                    {moment(timelineItem.dueDate).format("DD/MM/YYYY")}
                  </p>
                </div>
              </li>
              <li className="flex cursor-pointer items-center space-x-4 rounded-md p-2 hover:bg-gray-50">
                <Circle className="text-gray-300" />
                <div>
                  <span>Iteration 1</span>
                  <p className="text-sm text-gray-400">
                    {moment(timelineItem.dueDate).format("DD/MM/YYYY")}
                  </p>
                </div>
              </li>
              <li className="flex cursor-pointer items-center space-x-4 rounded-md p-2 hover:bg-gray-50">
                <Circle className="text-gray-300" />
                <div>
                  <span>Iteration 1</span>
                  <p className="text-sm text-gray-400">
                    {moment(timelineItem.dueDate).format("DD/MM/YYYY")}
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TimelineCardsOverview;
