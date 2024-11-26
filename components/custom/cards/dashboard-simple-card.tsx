import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardSimpleCard {
  title: string;
  content?: string;
  icon: LucideIcon;
  horizontal?: boolean;
  onClick?: () => void;
}

const DashboardSimpleCard = ({
  title,
  content,
  horizontal,
  onClick,
  ...props
}: DashboardSimpleCard) => {
  if (horizontal) {
    return (
      <div
        className="flex w-max cursor-pointer items-center justify-between space-x-4 rounded-lg border p-6 hover:bg-gray-50"
        onClick={onClick}
      >
        <div className="flex items-center space-x-2">
          {<props.icon />}
          <p>{title}</p>
        </div>
        {content && (
          <Badge variant={"gray"} className="font-semibold">
            {content}
          </Badge>
        )}
      </div>
    );
  }
  return (
    <Card
      className="w-[200px] cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <p>{title}</p>
          {<props.icon />}
        </div>
      </CardHeader>
      <CardContent className="text-2xl font-bold">{content}</CardContent>
    </Card>
  );
};

export default DashboardSimpleCard;
