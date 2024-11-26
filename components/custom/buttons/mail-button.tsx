import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mail } from "lucide-react";

interface MailButtonProps {
  email: string;
}

const MailButton = ({ email }: MailButtonProps) => {
  const handleClick = () => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={"outline"} onClick={handleClick} className="px-2">
            <Mail className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{email}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MailButton;
