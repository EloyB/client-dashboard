import {
  Building2,
  Calendar,
  FileText,
  FolderKanban,
  Kanban,
  LayoutDashboard,
  Ticket,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra hrefs that should also highlight this item as active. */
  alsoActiveFor?: string[];
};

function matchesHref(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }
  // The area root (/app, /portal) must never prefix-match every subroute.
  if (href === '/app' || href === '/portal') {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return [item.href, ...(item.alsoActiveFor ?? [])].some((href) => matchesHref(pathname, href));
}

export const adminSidebarItems: NavItem[] = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/clients', label: 'Klanten', icon: Building2 },
  { href: '/app/projects', label: 'Projecten', icon: FolderKanban },
  { href: '/app/board', label: 'Takenbord', icon: Kanban },
  { href: '/app/tickets', label: 'Tickets', icon: Ticket },
  { href: '/app/calendar', label: 'Agenda', icon: Calendar },
  { href: '/app/documents', label: 'Documenten', icon: FileText },
];

export const adminTabItems: NavItem[] = [
  { href: '/app', label: 'Start', icon: LayoutDashboard },
  { href: '/app/projects', label: 'Projecten', icon: FolderKanban },
  { href: '/app/board', label: 'Taken', icon: Kanban },
  { href: '/app/tickets', label: 'Tickets', icon: Ticket },
  { href: '/app/calendar', label: 'Agenda', icon: Calendar },
];

export const adminOverflowItems: NavItem[] = [
  { href: '/app/clients', label: 'Klanten', icon: Building2 },
  { href: '/app/documents', label: 'Documenten', icon: FileText },
];

export const portalSidebarItems: NavItem[] = [
  { href: '/portal', label: 'Start', icon: LayoutDashboard },
  { href: '/portal/projects', label: 'Projecten', icon: FolderKanban },
  { href: '/portal/tickets', label: 'Tickets', icon: Ticket },
  { href: '/portal/calendar', label: 'Agenda', icon: Calendar },
  { href: '/portal/documents', label: 'Documenten', icon: FileText },
];

export const portalTabItems: NavItem[] = [
  { href: '/portal', label: 'Start', icon: LayoutDashboard, alsoActiveFor: ['/portal/projects'] },
  { href: '/portal/tickets', label: 'Tickets', icon: Ticket },
  { href: '/portal/calendar', label: 'Agenda', icon: Calendar },
  { href: '/portal/documents', label: 'Documenten', icon: FileText },
];
