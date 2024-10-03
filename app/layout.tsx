"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import "./globals.css";
import { useState } from "react";
import SideNav from "@/components/custom/side-nav";
import { navItems } from "@/lib/constants";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  return (
    <html lang="en">
      <body>
        <TooltipProvider>
          <ResizablePanelGroup direction="horizontal" className="items-stretch">
            <ResizablePanel
              defaultSize={20}
              maxSize={20}
              minSize={10}
              collapsible={true}
              className={cn(
                isCollapsed &&
                  "min-w-[50px] transition-all duration-300 ease-in-out",
              )}
              onCollapse={() => {
                setIsCollapsed(true);
              }}
              onExpand={() => {
                setIsCollapsed(false);
              }}
            >
              <SideNav navItems={navItems} isCollapsed={isCollapsed} />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={80} minSize={80}>
              <div className="p-16">{children}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TooltipProvider>
      </body>
    </html>
  );
}
