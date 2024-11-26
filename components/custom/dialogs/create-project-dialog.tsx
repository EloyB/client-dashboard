"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { TableName } from "@/models/enums/table-name";
import { Client } from "@/models/client";
import { Project } from "@/models/project";
import { useFetchClients } from "@/hooks/use-fetch-clients";
import Loader from "../loaders/loader";

interface CreateProjectDialogProps {
  children: React.ReactElement;
  clientId?: string;
  onClose?: () => void;
}

const CreateProjectDialog = ({
  children,
  clientId,
  onClose,
}: CreateProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const { clients, clientLoading } = useFetchClients();

  const formSchema = z.object({
    title: z.string().min(1),
    clientId: z
      .string()
      .min(1, { message: "You are required to select a client" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      clientId: clientId ?? "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
    handleCreateProject(data);
  };

  const handleCreateProject = async (project: Partial<Project>) => {
    await supabase.from(TableName.Project).insert([project]).select();

    setOpen(false);

    if (onClose) {
      onClose();
    }
  };

  if (clientLoading) {
    return <Loader />;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>
            Fill in all data for the new project
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name={"title"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={"clientId"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {clients.map((client, index) => (
                              <SelectItem key={index} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-4">
                <Button variant={"ghost"} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create project</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
