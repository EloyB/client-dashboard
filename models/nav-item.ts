import { LucideIcon } from "lucide-react";

export interface NavItem {
  route: string;
  title: string;
  label?: string;
  icon: LucideIcon;
  variant: "default" | "ghost";
}
