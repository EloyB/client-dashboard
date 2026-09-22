'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Archive, Loader2, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DetailHeader } from '@/components/shared/DetailHeader';
import {
  DateField,
  SelectField,
  TextareaField,
  TextField,
  UrlField,
} from '@/components/shared/FormFields';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import { archiveProject, createProject, updateProject } from '@/features/projects/actions';
import { projectFormSchema, statusesRequiringDueDate } from '@/features/projects/schemas';
import type { SelectableClient } from '@/features/projects/queries';
import { applyFormActionErrors } from '@/lib/form-action';

type ProjectFormInput = z.input<typeof projectFormSchema>;

const FORM_ID = 'project-form';

const statusOptions = [
  { value: 'planned', label: 'Gepland' },
  { value: 'active', label: 'Actief' },
  { value: 'maintenance', label: 'Onderhoud' },
  { value: 'completed', label: 'Afgerond' },
  { value: 'archived', label: 'Gearchiveerd' },
];

const statusHints: Record<string, string> = {
  planned: 'Nog niet gestart; taken en tickets kunnen al voorbereid worden.',
  active: 'In uitvoering; taken en tickets lopen.',
  maintenance: 'Actieve fase voorbij; nog wel doorlopend onderhoud.',
  completed: 'Project is klaar en opgeleverd.',
  archived: 'Verborgen uit het standaardoverzicht.',
};

export function ProjectForm({
  projectId,
  projectName,
  currentStatus,
  defaultValues,
  clients,
}: {
  /** Present only when editing an existing project. */
  projectId?: string;
  projectName?: string;
  currentStatus?: string;
  defaultValues: ProjectFormInput;
  clients: SelectableClient[];
}) {
  const router = useRouter();
  const isEditing = Boolean(projectId);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const { control, handleSubmit, formState, setError } = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });

  const status = useWatch({ control, name: 'status' });

  async function onSubmit(data: ProjectFormInput) {
    const result = projectId
      ? await updateProject({ ...data, projectId })
      : await createProject(data);

    if (!result.success) {
      applyFormActionErrors(setError, result);
      return;
    }

    if (isEditing) {
      showSuccessToast('Project bijgewerkt');
    }
    router.push(`/app/projects/${result.data.projectId}`);
    router.refresh();
  }

  async function handleArchiveConfirm() {
    if (!projectId) return;
    setIsArchiving(true);
    try {
      await archiveProject(projectId);
      showSuccessToast('Project gearchiveerd');
      setArchiveDialogOpen(false);
      router.push(`/app/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      showErrorToast('Archiveren mislukt', error instanceof Error ? error.message : undefined);
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Projecten', href: '/app/projects' },
          { label: isEditing ? (projectName ?? 'Project bewerken') : 'Nieuw project' },
        ]}
        title={isEditing ? 'Project bewerken' : 'Nieuw project'}
        secondaryAction={
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <X strokeWidth={1.75} />
            Annuleren
          </Button>
        }
        primaryAction={
          <Button type="submit" form={FORM_ID} disabled={formState.isSubmitting}>
            {formState.isSubmitting ? (
              <Loader2 className="animate-spin" strokeWidth={1.75} />
            ) : (
              <Save strokeWidth={1.75} />
            )}
            {isEditing ? 'Wijzigingen opslaan' : 'Project opslaan'}
          </Button>
        }
        overflowActions={
          isEditing &&
          currentStatus !== 'archived' && (
            <DropdownMenuItem onSelect={() => setArchiveDialogOpen(true)}>
              <Archive strokeWidth={1.75} />
              Archiveren
            </DropdownMenuItem>
          )
        }
      />

      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8"
        noValidate
      >
        <fieldset disabled={formState.isSubmitting} className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Projectgegevens</CardTitle>
              <p className="text-small text-muted-foreground">Velden met * zijn verplicht.</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <SelectField
                  control={control}
                  name="clientId"
                  label="Klant"
                  required
                  options={clients.map((client) => ({ value: client.id, label: client.name }))}
                  placeholder="Kies een klant"
                />
                <p className="text-small text-muted-foreground mt-1.5">
                  Staat de klant er niet bij?{' '}
                  <Link href="/app/clients/new" className="text-primary font-semibold underline">
                    Eerst een klant aanmaken
                  </Link>
                  .
                </p>
              </div>

              <TextField
                control={control}
                name="name"
                label="Projectnaam"
                required
                hint="De klantnaam hoeft er niet in: die staat er in de lijsten al naast."
              />

              <TextareaField
                control={control}
                name="description"
                label="Omschrijving"
                hint="Zichtbaar in het klantportaal."
              />

              <UrlField
                control={control}
                name="websiteUrl"
                label="Website"
                hint="Wordt gebruikt om meldingen uit het portaal aan een pagina te koppelen."
                placeholder="voorbeeld.be"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  control={control}
                  name="status"
                  label="Status"
                  required
                  options={statusOptions}
                  hint={statusHints[status]}
                />
                <DateField control={control} name="startDate" label="Startdatum" required />
              </div>

              <div className="sm:w-1/2 sm:pr-2">
                <DateField
                  control={control}
                  name="dueDate"
                  label="Opleverdatum"
                  required={statusesRequiringDueDate.includes(
                    status as (typeof statusesRequiringDueDate)[number],
                  )}
                  hint="Verplicht bij een gepland of actief project; moet na de startdatum vallen."
                />
              </div>
            </CardContent>
          </Card>
        </fieldset>
      </form>

      {isEditing && (
        <ConfirmDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          title="Project archiveren?"
          description={`${projectName ?? 'Dit project'} verdwijnt uit het standaardoverzicht, maar blijft bewaard.`}
          confirmLabel={isArchiving ? 'Bezig...' : 'Archiveren'}
          confirmIcon={Archive}
          onConfirm={handleArchiveConfirm}
        />
      )}
    </>
  );
}
