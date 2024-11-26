import { Client } from "@/models/client";
import { NavItem } from "@/models/nav-item";
import { Project } from "@/models/project";
import { TimelineItem } from "@/models/timeline-item";
import { LayoutDashboard, PanelsTopLeft, SquareUser } from "lucide-react";

export const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    route: "/",
    variant: "default",
  },
  {
    icon: SquareUser,
    title: "Clients",
    route: "/clients",
    variant: "default",
  },
  {
    icon: PanelsTopLeft,
    title: "Projects",
    route: "/projects",
    variant: "default",
  },
];

export const projectsTabelHeaders: { key: keyof Project; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "clientId", label: "Client" },
  { key: "createdOn", label: "Started on" },
  { key: "updatedOn", label: "Updated on" },
  { key: "status", label: "Status" },
];

export const clientsTableHeaders: { key: keyof Client; label: string }[] = [
  { key: "name", label: "Client" },
  { key: "email", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "vatNumber", label: "VAT" },
  { key: "balance", label: "Balance" },
  { key: "createdOn", label: "Client since" },
];
