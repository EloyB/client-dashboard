"use client";

import Loader from "@/components/custom/loaders/loader";
import SideNav from "@/components/custom/side-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import useAuthSession from "@/hooks/use-auth-session";
import { navItems } from "@/lib/constants";
import "../globals.css";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuthSession();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SideNav navItems={navItems} user={user} />
      <main className="h-screen w-full p-16">{children}</main>
    </SidebarProvider>
  );
}
