import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Phone } from "lucide-react";
import React from "react";

interface CallButtonProps {
  phoneNumber: string;
}

const CallButton = ({ phoneNumber }: CallButtonProps) => {
  const handleClick = () => {
    window.location.href = `callto:${phoneNumber}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={"outline"} onClick={handleClick} className="px-2">
            <Phone className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{phoneNumber}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CallButton;
