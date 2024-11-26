"use client";

import CallButton from "@/components/custom/buttons/call-button";
import MailButton from "@/components/custom/buttons/mail-button";
import ClientProjectCard from "@/components/custom/cards/client-project-card";
import CreateProjectDialog from "@/components/custom/dialogs/create-project-dialog";
import Loader from "@/components/custom/loaders/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFetchClientById } from "@/hooks/use-fetch-client-by-id";
import { FileText, MapPin, PlusIcon, TriangleAlert } from "lucide-react";

const ClientDetailPage = ({ params }: { params: { id: string } }) => {
  const { client, clientLoading, error, refetch, errorStatus } =
    useFetchClientById(params.id);

  if (clientLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center space-x-4 p-8">
        <TriangleAlert />
        <h3 className="text-2xl">{errorStatus}</h3>
      </div>
    );
  }

  if (!client) {
    return <div>No client found!</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-16">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{client.name}</h1>
          <div className="flex items-center space-x-2">
            <Badge variant={"gray"} className="space-x-2">
              <FileText className="h-4 w-4" />
              <span>{client.vatNumber}</span>
            </Badge>
            <Badge variant={"gray"} className="space-x-2">
              <MapPin className="h-4 w-4" />
              <span>{client.address}</span>
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CallButton phoneNumber={client.phone} />
          <MailButton email={client.email} />
        </div>
      </div>
      <div className="mb-16">
        <div className="flex items-center justify-between">
          <h3 className="mb-4 text-2xl font-semibold">Projects</h3>
          <CreateProjectDialog onClose={() => refetch()} clientId={client.id}>
            <Button variant={"outline"} className="space-x-2">
              <PlusIcon />
              <span>Create new project</span>
            </Button>
          </CreateProjectDialog>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {client.project?.length ? (
            client.project.map((project, index) => (
              <ClientProjectCard key={index} project={project} />
            ))
          ) : (
            <div>No projects found for client</div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="mb-4 text-2xl font-semibold">Documents</h3>
        <CreateProjectDialog onClose={() => refetch()} clientId={client.id}>
          <Button variant={"outline"} className="space-x-2">
            <PlusIcon />
            <span>Add new document</span>
          </Button>
        </CreateProjectDialog>
      </div>
      <div className="grid grid-cols-4">
        <div>No documents found for client</div>
      </div>
    </div>
  );
};

export default ClientDetailPage;
