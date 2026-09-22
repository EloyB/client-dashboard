'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DetailHeader } from '@/components/shared/DetailHeader';
import {
  DateField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from '@/components/shared/FormFields';
import { FileUploadField } from '@/components/shared/FileUpload';
import { FormDialog } from '@/components/shared/FormDialog';
import { FormSheet } from '@/components/shared/FormSheet';
import { SkeletonRows } from '@/components/shared/SkeletonRows';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TimelineItem } from '@/components/shared/ListRow';
import { applyFormActionErrors, createFormAction } from '@/lib/form-action';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';

// Test-only schema for this page — no feature schema, nothing is saved.
const demoProjectSchema = z
  .object({
    name: z.string().min(1, 'Projectnaam is verplicht'),
    client: z.string().min(1, 'Kies een klant'),
    status: z.enum(['planned', 'active', 'maintenance', 'completed', 'archived']),
    description: z.string().optional(),
    startDate: z.date({ error: 'Startdatum is verplicht' }),
    dueDate: z.date({ error: 'Opleverdatum is verplicht' }),
    visibleToClient: z.boolean(),
  })
  .refine((data) => data.dueDate > data.startDate, {
    message: 'Opleverdatum moet na de startdatum vallen',
    path: ['dueDate'],
  });

type DemoProjectInput = z.infer<typeof demoProjectSchema>;

// Simulates a server action: rejects "Test project" to demonstrate a
// server-side formError even though the client already validated the input.
const saveDemoProject = createFormAction(demoProjectSchema, async (data) => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (data.name.toLowerCase() === 'test project') {
    throw new Error('De server antwoordde niet. Probeer opnieuw.');
  }
  return { id: 'demo-1', ...data };
});

function DemoProjectFields({
  control,
}: {
  control: ReturnType<typeof useForm<DemoProjectInput>>['control'];
}) {
  return (
    <>
      <TextField control={control} name="name" label="Projectnaam" required />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          control={control}
          name="client"
          label="Klant"
          required
          options={[
            { label: 'Verlinden & Zn', value: 'verlinden' },
            { label: 'Bakkerij Vermeulen', value: 'vermeulen' },
          ]}
        />
        <SelectField
          control={control}
          name="status"
          label="Status"
          options={[
            { label: 'Gepland', value: 'planned' },
            { label: 'Actief', value: 'active' },
            { label: 'Onderhoud', value: 'maintenance' },
            { label: 'Afgerond', value: 'completed' },
            { label: 'Gearchiveerd', value: 'archived' },
          ]}
        />
      </div>
      <TextareaField
        control={control}
        name="description"
        label="Omschrijving"
        hint="Zichtbaar in het klantportaal."
      />
      <div className="grid grid-cols-2 gap-3">
        <DateField control={control} name="startDate" label="Startdatum" required />
        <DateField control={control} name="dueDate" label="Opleverdatum" required />
      </div>
      <SwitchField
        control={control}
        name="visibleToClient"
        label="Zichtbaar voor klant"
        hint="De klant ziet dit project dan in het portaal."
      />
      <FileUploadField
        label="Schermafbeelding"
        onUpload={async () => {
          await new Promise((resolve) => setTimeout(resolve, 900));
        }}
      />
    </>
  );
}

export function FormPatternDemo() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sheetForm = useForm<DemoProjectInput>({
    resolver: zodResolver(demoProjectSchema),
    defaultValues: {
      name: '',
      client: '',
      status: 'active',
      description: '',
      visibleToClient: true,
    },
  });

  const renameForm = useForm<{ name: string }>({
    resolver: zodResolver(z.object({ name: z.string().min(1, 'Naam is verplicht') })),
    defaultValues: { name: 'Herbouw website Verlinden & Zn' },
  });

  async function handleSheetSubmit(data: DemoProjectInput) {
    const result = await saveDemoProject(data);
    if (!result.success) {
      applyFormActionErrors(sheetForm.setError, result);
      if (result.formError) {
        showErrorToast('Opslaan mislukt', result.formError, {
          label: 'Opnieuw',
          onClick: sheetForm.handleSubmit(handleSheetSubmit),
        });
      }
      return;
    }
    showSuccessToast('Project opgeslagen', `"${result.data.name}" is aangemaakt.`);
    setSheetOpen(false);
    sheetForm.reset();
  }

  async function handleRenameSubmit(data: { name: string }) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    showSuccessToast('Project hernoemd', `Nieuwe naam: "${data.name}".`);
    setDialogOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setSheetOpen(true)}>Nieuw project (sheet)</Button>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          Project hernoemen (dialoog)
        </Button>
      </div>
      <p className="text-small text-muted-foreground">
        Vul &quot;Test project&quot; in als projectnaam om de serverfout-staat te zien — de
        client-validatie (verplichte velden, opleverdatum na startdatum) laat dat overigens al
        eerder falen als je andere velden leeg laat.
      </p>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Nieuw project"
        description="Voorbeeldformulier — slaat niets echt op."
        primaryAction={
          <Button
            className="w-full sm:w-auto"
            disabled={sheetForm.formState.isSubmitting}
            onClick={sheetForm.handleSubmit(handleSheetSubmit)}
          >
            {sheetForm.formState.isSubmitting ? 'Bezig...' : 'Project opslaan'}
          </Button>
        }
      >
        <DemoProjectFields control={sheetForm.control} />
      </FormSheet>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Project hernoemen"
        primaryAction={
          <Button
            disabled={renameForm.formState.isSubmitting}
            onClick={renameForm.handleSubmit(handleRenameSubmit)}
          >
            Opslaan
          </Button>
        }
      >
        <TextField control={renameForm.control} name="name" label="Naam" required />
      </FormDialog>
    </div>
  );
}

export function FeedbackDemo() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-overline text-muted-foreground uppercase">Toasts</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                showSuccessToast('Ticket opgeslagen', 'TCK-2041 staat nu op In behandeling.')
              }
            >
              Succes tonen
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                showSuccessToast('Taak verwijderd', 'Cookiebanner instellen', {
                  label: 'Ongedaan maken',
                  onClick: () => showSuccessToast('Hersteld', 'Taak staat terug in de lijst.'),
                })
              }
            >
              Succes met actie
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                showErrorToast('Opslaan mislukt', 'De server antwoordde niet.', {
                  label: 'Opnieuw',
                  onClick: () => showSuccessToast('Opgeslagen', 'Het lukte de tweede keer wel.'),
                })
              }
            >
              Fout tonen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-overline text-muted-foreground uppercase">Bevestigingsdialoog</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Project verwijderen
            </Button>
            <Button variant="outline" onClick={() => setArchiveOpen(true)}>
              Project archiveren
            </Button>
          </div>
          <p className="text-small text-muted-foreground">
            Verwijderen vraagt de naam te typen, archiveren niet — zelfde dialoog, andere knopkleur.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-overline text-muted-foreground uppercase">Skeleton (rijniveau)</p>
            <Button size="sm" variant="ghost" onClick={() => setShowSkeleton((value) => !value)}>
              {showSkeleton ? 'Toon data' : 'Toon skeleton'}
            </Button>
          </div>
          {showSkeleton ? (
            <SkeletonRows count={3} />
          ) : (
            <p className="text-body text-muted-foreground">Data geladen.</p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title="Project verwijderen?"
        description="Herbouw website Verlinden & Zn wordt definitief verwijderd, samen met alle taken, tickets en documenten. Dit kan niet ongedaan worden."
        confirmLabel="Definitief verwijderen"
        confirmationText="Herbouw website Verlinden & Zn"
        onConfirm={() => {
          setDeleteOpen(false);
          showSuccessToast('Project verwijderd');
        }}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Project archiveren?"
        description="Het project verdwijnt uit de actieve lijsten en uit het klantportaal. U kunt het later terugzetten."
        confirmLabel="Archiveren"
        onConfirm={() => {
          setArchiveOpen(false);
          showSuccessToast('Project gearchiveerd');
        }}
      />
    </div>
  );
}

export function DetailPatternDemo() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <DetailHeader
          breadcrumbs={[{ label: 'Tickets', href: '#' }, { label: 'TCK-2041' }]}
          title="Contactformulier verzendt niet"
          badge={
            <>
              <StatusBadge domain="ticket" status="new" />
              <StatusBadge domain="priority" priority="high" />
            </>
          }
          secondaryAction={
            <Button variant="outline" size="sm">
              Naar taak
            </Button>
          }
          primaryAction={<Button size="sm">In behandeling nemen</Button>}
          overflowActions={
            <>
              <DropdownMenuItem>Toewijzen</DropdownMenuItem>
              <DropdownMenuItem>Prioriteit wijzigen</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                Ticket verwijderen
              </DropdownMenuItem>
            </>
          }
        />
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          variant="destructive"
          title="Ticket verwijderen?"
          description="Dit ticket en de bijhorende reacties worden definitief verwijderd."
          confirmLabel="Definitief verwijderen"
          onConfirm={() => {
            setDeleteOpen(false);
            showSuccessToast('Ticket verwijderd');
          }}
        />
        <div className="px-4 pb-4">
          <p className="text-overline text-muted-foreground mb-2 uppercase">Tijdlijn</p>
          <div className="flex flex-col gap-2">
            <TimelineItem timestamp="vandaag 08:14">
              <span className="font-semibold">Katrien Verlinden</span> meldde dit ticket
            </TimelineItem>
            <TimelineItem timestamp="vandaag 08:20">
              Prioriteit gezet op <span className="font-semibold">Hoog</span>
            </TimelineItem>
            <TimelineItem timestamp="vandaag 09:02">
              Taak <span className="font-mono font-semibold">TSK-401</span> gekoppeld
            </TimelineItem>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
