"use client";

import SearchButton from "@/components/custom/buttons/search-button";
import DashboardSimpleCard from "@/components/custom/cards/dashboard-simple-card";
import ProjectsTable from "@/components/custom/tables/projects-table";
import { PanelsTopLeft, Search, SquareUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { FiFigma, FiGithub, FiTrello } from "react-icons/fi";
import { SiFirebase } from "react-icons/si";
import { FaStripeS } from "react-icons/fa";
import { useFetchProjects } from "@/hooks/use-fetch-projects";
import Loader from "@/components/custom/loaders/loader";
import { useFetchClients } from "@/hooks/use-fetch-clients";

export default function Dashboard() {
  const { projects, projectsLoading } = useFetchProjects();
  const { clients, clientLoading } = useFetchClients();

  const router = useRouter();

  return (
    <div className="max-w-screen-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <SearchButton />
      </div>
      <div className="flex items-center space-x-8">
        <DashboardSimpleCard
          title="Clients"
          icon={SquareUser}
          content={clients.length.toString()}
          horizontal={true}
          onClick={() => router.push("/clients")}
        />
        <DashboardSimpleCard
          title="Projects"
          icon={PanelsTopLeft}
          content={projects.length.toString()}
          horizontal={true}
          onClick={() => router.push("/projects")}
        />
      </div>
      <div>
        <h3 className="mb-4 text-2xl font-semibold">Tools</h3>
        <div className="flex space-x-8">
          <div className="cursor-pointer rounded-md border p-6 hover:bg-gray-50">
            <FiFigma className="h-8 w-8" />
          </div>
          <div className="cursor-pointer rounded-md border p-6 hover:bg-gray-50">
            <FiTrello className="h-8 w-8" />
          </div>
          <div className="cursor-pointer rounded-md border p-6 hover:bg-gray-50">
            <FiGithub className="h-8 w-8" />
          </div>
          <div className="cursor-pointer rounded-md border p-6 hover:bg-gray-50">
            <SiFirebase className="h-8 w-8" />
          </div>
          <div className="cursor-pointer rounded-md border p-6 hover:bg-gray-50">
            <FaStripeS className="h-8 w-8" />
          </div>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <h3 className="mb-4 text-2xl font-semibold">
              Last updated projects
            </h3>
            {projectsLoading ? (
              <Loader />
            ) : (
              <ProjectsTable projects={projects} />
            )}
          </div>
          <div>
            <h3 className="mb-4 text-2xl font-semibold">
              Last reported issues
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
