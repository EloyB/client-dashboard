"use client";
import { cn } from "@/lib/utils";
import { NavItem } from "@/models/nav-item";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { usePathname } from "next/navigation";

interface SideNavProps {
  navItems: NavItem[];
  isCollapsed: boolean;
}

function SideNav({ navItems, isCollapsed }: SideNavProps) {
  const pathName = usePathname();

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex h-screen flex-col gap-4 bg-zinc-900 p-4"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {navItems.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={link.route}
                  className={cn(
                    buttonVariants({ variant: link.variant, size: "icon" }),
                    "h-9 w-9",
                    link.variant === "default" &&
                      "hover:bg-zinc-800 dark:bg-black dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
                    pathName === link.route && "bg-zinc-800",
                  )}
                >
                  <link.icon className="h-6 w-6" />
                  <span className="sr-only">{link.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && (
                  <span className="ml-auto text-muted-foreground">
                    {link.label}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={index}
              href={link.route}
              className={cn(
                buttonVariants({ variant: link.variant, size: "sm" }),
                link.variant === "default" &&
                  "mb-2 hover:bg-zinc-800 dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                "justify-start",
                pathName === link.route && "bg-zinc-800",
              )}
            >
              <link.icon className="mr-4 h-6 w-6" />
              <span className="text-lg">{link.title}</span>
              {link.label && (
                <span
                  className={cn(
                    "ml-auto",
                    link.variant === "default" &&
                      "text-background dark:text-white",
                  )}
                >
                  {link.label}
                </span>
              )}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}

export default SideNav;
