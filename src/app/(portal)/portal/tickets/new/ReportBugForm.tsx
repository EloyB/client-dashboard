'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailHeader } from '@/components/shared/DetailHeader';
import { FileUploadField, type FileUploadCallback } from '@/components/shared/FileUpload';
import { SelectField, TextareaField, TextField, UrlField } from '@/components/shared/FormFields';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { showErrorToast } from '@/components/shared/toast';
import { createTicket } from '@/features/tickets/actions';
import { createTicketSchema } from '@/features/tickets/schemas';
import { uploadLimits } from '@/features/files/schemas';
import { uploadViaPresignedUrl } from '@/features/files/uploadViaPresignedUrl';
import type { Priority } from '@/db/schema';
import { applyFormActionErrors } from '@/lib/form-action';
import type { SelectableProject } from '@/features/tickets/queries';

type FormInput = z.input<typeof createTicketSchema>;

const FORM_ID = 'report-bug-form';

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Laag' },
  { value: 'medium', label: 'Middel' },
  { value: 'high', label: 'Hoog' },
];

const priorityHints: Record<Priority, string> = {
  low: 'Kleine onvolkomenheid, geen haast.',
  medium: 'Hindert bezoekers, maar de site werkt.',
  high: 'De site of een belangrijke functie werkt niet.',
};

const attachmentAccept = uploadLimits.ticket_attachment.mimeTypes.join(',');

type SubmittedTicket = {
  priority: Priority;
  pageUrl: string;
  attachmentCount: number;
};

export function ReportBugForm({ projects }: { projects: SelectableProject[] }) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState<SubmittedTicket | null>(null);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [uploaderKey, setUploaderKey] = useState(0);

  const defaultValues: FormInput = {
    projectId: projects.length === 1 ? projects[0].id : '',
    title: '',
    description: '',
    pageUrl: '',
    priority: 'medium',
    fileIds: [],
  };

  const { control, handleSubmit, formState, setError, reset } = useForm<FormInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues,
  });

  const projectId = useWatch({ control, name: 'projectId' });
  const priority = useWatch({ control, name: 'priority' });

  const handleUpload: FileUploadCallback = async (file, onProgress, signal) => {
    setPendingUploads((count) => count + 1);
    try {
      const fileId = await uploadViaPresignedUrl(
        file,
        onProgress,
        signal,
        projectId,
        'ticket_attachment',
      );
      setUploadedFileIds((ids) => [...ids, fileId]);
    } finally {
      setPendingUploads((count) => count - 1);
    }
  };

  async function onSubmit(data: FormInput) {
    const result = await createTicket({ ...data, fileIds: uploadedFileIds });

    if (!result.success) {
      applyFormActionErrors(setError, result);
      if (result.formError) {
        showErrorToast('Melding versturen mislukt', result.formError);
      }
      return;
    }

    setSubmitted({
      priority: data.priority,
      pageUrl: data.pageUrl,
      attachmentCount: uploadedFileIds.length,
    });
  }

  function reportAnother() {
    setSubmitted(null);
    setUploadedFileIds([]);
    setUploaderKey((key) => key + 1);
    reset(defaultValues);
  }

  if (submitted) {
    return (
      <>
        <DetailHeader
          breadcrumbs={[
            { label: 'Tickets', href: '/portal/tickets' },
            { label: 'Probleem melden' },
          ]}
          title="Probleem melden"
        />
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="max-w-2xl">
            <CardContent className="flex flex-col gap-5 pt-6">
              <div className="flex items-center gap-3.5">
                <div className="bg-success-muted text-success flex size-11 shrink-0 items-center justify-center rounded-full">
                  <CheckCircle2 className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-display text-h3">Uw melding is verstuurd</p>
                  <p className="text-body text-muted-foreground">
                    We bekijken ze en houden u op de hoogte.
                  </p>
                </div>
              </div>

              <div className="border-border-subtle flex flex-col border-t pt-1">
                <div className="border-border-subtle flex items-center justify-between border-b py-2.5 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge domain="ticket" status="new" audience="portal" />
                </div>
                <div className="border-border-subtle flex items-center justify-between border-b py-2.5 text-sm">
                  <span className="text-muted-foreground">Prioriteit</span>
                  <StatusBadge domain="priority" priority={submitted.priority} />
                </div>
                {submitted.pageUrl && (
                  <div className="border-border-subtle flex items-center justify-between border-b py-2.5 text-sm">
                    <span className="text-muted-foreground">Pagina</span>
                    <span className="font-medium">{submitted.pageUrl}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-muted-foreground">Bijlagen</span>
                  <span className="font-medium">
                    {submitted.attachmentCount === 0
                      ? 'Geen'
                      : submitted.attachmentCount === 1
                        ? '1 schermafbeelding'
                        : `${submitted.attachmentCount} schermafbeeldingen`}
                  </span>
                </div>
              </div>

              <Button type="button" onClick={reportAnother} className="self-start">
                Nog een melding maken
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Tickets', href: '/portal/tickets' }, { label: 'Probleem melden' }]}
        title="Probleem melden"
        secondaryAction={
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <X strokeWidth={1.75} />
            Annuleren
          </Button>
        }
        primaryAction={
          <Button
            type="submit"
            form={FORM_ID}
            disabled={formState.isSubmitting || pendingUploads > 0}
          >
            {formState.isSubmitting ? (
              <Loader2 className="animate-spin" strokeWidth={1.75} />
            ) : (
              <Send strokeWidth={1.75} />
            )}
            Melding versturen
          </Button>
        }
      />

      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3 lg:p-8"
        noValidate
      >
        <fieldset disabled={formState.isSubmitting} className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <SelectField
                control={control}
                name="projectId"
                label="Project"
                required
                options={projects.map((project) => ({ value: project.id, label: project.name }))}
                placeholder="Kies een project"
              />

              <TextField
                control={control}
                name="title"
                label="Titel"
                required
                placeholder="Bijvoorbeeld: contactformulier verzendt niet"
                hint="Eén zin die het probleem samenvat."
              />

              <TextareaField
                control={control}
                name="description"
                label="Omschrijving"
                placeholder="Wat gebeurde er, en wat verwachtte u?"
                rows={5}
              />

              <UrlField
                control={control}
                name="pageUrl"
                label="Pagina-URL"
                hint="Optioneel, zodat we weten waar het probleem zich voordoet."
              />

              <SelectField
                control={control}
                name="priority"
                label="Prioriteit"
                required
                options={priorityOptions}
                hint={priorityHints[priority as Priority]}
              />

              <div className="flex flex-col gap-1.5">
                {projectId ? (
                  <FileUploadField
                    key={uploaderKey}
                    label="Schermafbeelding"
                    hint="PNG, JPG of WEBP, max. 10 MB. Een foto van het scherm helpt ons het probleem sneller te vinden."
                    accept={attachmentAccept}
                    multiple
                    onUpload={handleUpload}
                  />
                ) : (
                  <p className="text-small text-muted-foreground">
                    Kies eerst een project om een schermafbeelding toe te voegen.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </fieldset>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Wat gebeurt er daarna</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-body text-muted-foreground flex flex-col gap-2.5">
                <li>
                  Uw melding komt binnen met status <span className="font-semibold">Nieuw</span>.
                </li>
                <li>U krijgt een e-mail zodra de status verandert.</li>
                <li>Meldingen met hoge prioriteit worden binnen één werkdag bekeken.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </form>
    </>
  );
}
