import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DataList } from '@/components/shared/DataList';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileDropzone, FileRow } from '@/components/shared/FileUpload';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { DateBlock, ListRow } from '@/components/shared/ListRow';
import { PriorityBadge, type Priority } from '@/components/shared/PriorityBadge';
import { StatusBadge, type TicketStatus } from '@/components/shared/StatusBadge';

const neutralScale = [
  { name: 'neutral-0', className: 'bg-white', hex: '#FFFFFF', border: true },
  { name: 'neutral-50', className: 'bg-neutral-50', hex: '#FAFAF8', border: true },
  { name: 'neutral-100', className: 'bg-neutral-100', hex: '#F2F2EE', border: true },
  { name: 'neutral-200', className: 'bg-neutral-200', hex: '#E3E3E0' },
  { name: 'neutral-300', className: 'bg-neutral-300', hex: '#CFCFC9' },
  { name: 'neutral-400', className: 'bg-neutral-400', hex: '#9A9A92' },
  { name: 'neutral-500', className: 'bg-neutral-500', hex: '#6E6E66' },
  { name: 'neutral-600', className: 'bg-neutral-600', hex: '#55554F' },
  { name: 'neutral-800', className: 'bg-neutral-800', hex: '#2E2E2B' },
  { name: 'neutral-900', className: 'bg-neutral-900', hex: '#121212' },
];

const semanticSwatches = [
  {
    name: 'accent',
    className: 'bg-primary text-primary-foreground',
    description: '#0D3B33 · hover #0A2C26',
    usage: 'Primaire acties, actieve nav',
  },
  {
    name: 'success',
    className: 'bg-success text-success-foreground',
    description: '#2C6B34 · bg #E8F1E8',
    usage: 'Klaar, opgelost, opgeleverd',
  },
  {
    name: 'warning',
    className: 'bg-warning text-warning-foreground',
    description: '#8A4008 · bg #FBF0E2',
    usage: 'Review, feedback, deadline nabij',
  },
  {
    name: 'danger',
    className: 'bg-destructive text-destructive-foreground',
    description: '#B91C1C · bg #FDECEC',
    usage: 'Hoge prioriteit, geblokkeerd, verwijderen',
  },
  {
    name: 'info',
    className: 'bg-info text-info-foreground',
    description: '#1E5F8A · bg #E6F0F6',
    usage: 'Nieuw, informatief, in behandeling',
  },
];

const spacingScale = [
  { step: 1, px: 4 },
  { step: 2, px: 8 },
  { step: 3, px: 12 },
  { step: 4, px: 16 },
  { step: 6, px: 24 },
  { step: 8, px: 32 },
  { step: 12, px: 48 },
];

const radiusScale = [
  { name: 'sm', className: 'rounded-sm', label: '6px' },
  { name: 'md', className: 'rounded-md', label: '8px' },
  { name: 'lg', className: 'rounded-lg', label: '10px' },
  { name: 'xl', className: 'rounded-xl', label: '14px' },
  { name: 'full', className: 'rounded-full', label: 'full' },
];

type DemoTicket = {
  id: string;
  title: string;
  client: string;
  status: TicketStatus;
  priority: Priority;
};

const demoTickets: DemoTicket[] = [
  {
    id: 'TCK-2041',
    title: 'Contactformulier verzendt niet',
    client: 'Verlinden & Zn',
    status: 'new',
    priority: 'high',
  },
  {
    id: 'TCK-2039',
    title: 'Openingsuren kloppen niet',
    client: 'Bakkerij Vermeulen',
    status: 'in_progress',
    priority: 'medium',
  },
  {
    id: 'TCK-2036',
    title: 'Logo te klein op tablet',
    client: 'De Groene Kruidenier',
    status: 'resolved',
    priority: 'low',
  },
];

const ticketColumns: DataTableColumn<DemoTicket>[] = [
  {
    key: 'ticket',
    header: 'Ticket',
    cell: (row) => (
      <>
        <p className="font-semibold">{row.title}</p>
        <p className="text-small text-muted-foreground font-mono">{row.id}</p>
      </>
    ),
  },
  {
    key: 'client',
    header: 'Klant',
    cell: (row) => row.client,
    className: 'text-muted-foreground',
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge domain="ticket" status={row.status} />,
  },
  {
    key: 'priority',
    header: 'Prioriteit',
    cell: (row) => <PriorityBadge priority={row.priority} />,
  },
];

export default function DesignCheckPage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="text-overline text-muted-foreground uppercase">Design check</p>
        <h1 className="text-display font-display">Design system</h1>
        <p className="text-body text-muted-foreground">
          Tijdelijke pagina om de designtokens en componenten visueel te controleren tegen{' '}
          <code className="text-small font-mono">docs/design/</code>, op desktop en mobiel.
        </p>
      </div>

      {/* 1 · Kleur */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">1 · Kleur</h2>
          <p className="text-body text-muted-foreground">
            Neutrale basis met een warme ondertoon, één accent (diepgroen) en vier semantische
            kleuren.
          </p>
        </div>

        <div>
          <p className="text-overline text-muted-foreground mb-2 uppercase">Neutrale schaal</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {neutralScale.map((swatch) => (
              <div key={swatch.name} className="flex flex-col gap-1.5">
                <div
                  className={`h-16 rounded-lg ${swatch.className} ${swatch.border ? 'border-border border' : ''}`}
                />
                <p className="text-small font-medium">{swatch.name}</p>
                <p className="text-small text-muted-foreground font-mono">{swatch.hex}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-overline text-muted-foreground mb-2 uppercase">
            Accent &amp; semantisch
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {semanticSwatches.map((swatch) => (
              <Card key={swatch.name} className="overflow-hidden py-0">
                <div
                  className={`text-h3 flex h-16 items-center px-4 font-medium ${swatch.className}`}
                >
                  {swatch.name}
                </div>
                <CardContent className="flex flex-col gap-1 py-4">
                  <p className="text-small text-muted-foreground font-mono">{swatch.description}</p>
                  <p className="text-small text-muted-foreground">{swatch.usage}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 2 · Typografie */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">2 · Typografie</h2>
          <p className="text-body text-muted-foreground">
            Space Grotesk voor titels en getallen met gewicht, Instrument Sans voor alle interface-
            en lopende tekst, JetBrains Mono enkel voor ID&apos;s en codes.
          </p>
        </div>
        <Card className="divide-border-subtle divide-y py-0">
          {[
            {
              sample: 'Projectoverzicht',
              className: 'text-display font-display font-bold',
              meta: 'display · Space Grotesk 700 · 32/37 · -0.03em',
            },
            {
              sample: 'Openstaande tickets',
              className: 'text-h1 font-display font-semibold',
              meta: 'h1 · Space Grotesk 600 · 24/30',
            },
            {
              sample: 'Webshop De Groene Kruidenier',
              className: 'text-h2 font-display font-semibold',
              meta: 'h2 · Space Grotesk 600 · 18/24',
            },
            {
              sample: 'Contactpersoon toevoegen',
              className: 'text-h3 font-semibold',
              meta: 'h3 / label-lg · Instrument Sans 600 · 15/22',
            },
            {
              sample:
                'De klant vroeg om de openingsuren op de contactpagina automatisch te laten sluiten tijdens het bouwverlof.',
              className: 'text-body',
              meta: 'body · Instrument Sans 400 · 14/22',
            },
            {
              sample: 'Laatst bijgewerkt op 16 september 2026 om 14:32',
              className: 'text-small text-muted-foreground',
              meta: 'small · Instrument Sans 400 · 13/20',
            },
            {
              sample: 'SECTIELABEL',
              className: 'text-overline uppercase text-muted-foreground',
              meta: 'overline · 600 · 11 · 0.08em · uppercase',
            },
            {
              sample: 'TCK-2041 · PRJ-0142',
              className: 'font-mono text-small',
              meta: 'mono · JetBrains Mono 400 · 13/20',
            },
          ].map((row) => (
            <div
              key={row.meta}
              className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <p className={row.className}>{row.sample}</p>
              <p className="text-small text-muted-foreground font-mono whitespace-nowrap">
                {row.meta}
              </p>
            </div>
          ))}
        </Card>
      </section>

      {/* 3 · Ruimte & radius */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">3 · Ruimte &amp; radius</h2>
          <p className="text-body text-muted-foreground">
            4px-grid, identiek aan de standaard Tailwind-schaal. Compact op mobiel, iets ruimer
            vanaf md.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <p className="text-overline text-muted-foreground mb-1 uppercase">Spacing</p>
              {spacingScale.map((s) => (
                <div key={s.step} className="text-small flex items-center gap-3 font-mono">
                  <span className="text-muted-foreground w-16">
                    {s.step} · {s.px}px
                  </span>
                  <span className="bg-primary h-3" style={{ width: `${s.px}px` }} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <p className="text-overline text-muted-foreground uppercase">Radius</p>
              <div className="flex flex-wrap gap-6">
                {radiusScale.map((r) => (
                  <div key={r.name} className="flex flex-col items-center gap-1.5">
                    <div className={`size-14 bg-neutral-200 ${r.className}`} />
                    <p className="text-small text-muted-foreground">
                      {r.name} · {r.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-small text-muted-foreground">
                Knoppen en velden lg (10px), kaarten xl (14px), badges full. Eén schaduwniveau:
                shadow-card, verder enkel randen.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4 · Knoppen */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">4 · Knoppen</h2>
          <p className="text-body text-muted-foreground">
            Vijf varianten, drie maten. Mobiele raakvlakken minimaal 44px hoog.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-overline text-muted-foreground uppercase">Varianten</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Project aanmaken</Button>
                <Button variant="outline">Bewerken</Button>
                <Button variant="secondary">Filteren</Button>
                <Button variant="ghost">Annuleren</Button>
                <Button variant="destructive">Verwijderen</Button>
              </div>
              <div className="text-small text-muted-foreground flex flex-wrap gap-x-8 gap-y-1 font-mono">
                <span>default</span>
                <span>outline</span>
                <span>secondary</span>
                <span>ghost</span>
                <span>destructive</span>
              </div>
            </div>
            <div className="border-border-subtle flex flex-col gap-2 border-t pt-4">
              <p className="text-overline text-muted-foreground uppercase">Maten &amp; staten</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">sm · 32px</Button>
                <Button size="default">md · 40px</Button>
                <Button size="lg">lg · 48px</Button>
                <Button size="icon" aria-label="Toevoegen">
                  <Plus />
                </Button>
                <Button disabled>Uitgeschakeld</Button>
                <Button className="border-ring ring-ring/50 ring-3">Focus (voorbeeld)</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5 · Formuliervelden */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">5 · Formuliervelden</h2>
          <p className="text-body text-muted-foreground">
            Veldhoogte 40px (44px op mobiel), 1px rand, focusring in accent.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-name">Projectnaam</Label>
                <Input id="project-name" defaultValue="Herbouw site Meubelmakerij Verlinden" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-email">E-mailadres contactpersoon</Label>
                <Input id="contact-email" placeholder="naam@bedrijf.be" />
                <p className="text-small text-muted-foreground">
                  De klant krijgt hier een uitnodiging voor het portaal.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vat">Ondernemingsnummer</Label>
                <Input id="vat" defaultValue="BE 0652.123" aria-invalid />
                <p className="text-small text-destructive">
                  Een ondernemingsnummer bestaat uit 10 cijfers.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="focus-demo">Focus</Label>
                <Input
                  id="focus-demo"
                  defaultValue="Actief veld"
                  className="border-ring ring-ring/50 ring-3"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="in-ontwikkeling">
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-ontwikkeling">In ontwikkeling</SelectItem>
                    <SelectItem value="actief">Actief</SelectItem>
                    <SelectItem value="onderhoud">Onderhoud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bug-description">Omschrijving van de bug</Label>
                <Textarea
                  id="bug-description"
                  defaultValue="Het contactformulier stuurt geen bevestigingsmail naar de klant."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Schermafbeelding</Label>
                <FileDropzone />
                <FileRow
                  typeLabel="PNG"
                  name="contactformulier-fout.png"
                  meta="1,2 MB · geüpload"
                  action={
                    <Button variant="ghost" size="icon" aria-label="Verwijderen">
                      ×
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6 · Badges */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">6 · Badges</h2>
          <p className="text-body text-muted-foreground">
            Statusbadges zijn gevuld en rond; prioriteit gebruikt een rand plus stip, zodat status
            en prioriteit naast elkaar leesbaar blijven.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <p className="text-overline text-muted-foreground uppercase">Taakstatus (intern)</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge domain="task" status="todo" />
                <StatusBadge domain="task" status="in_progress" />
                <StatusBadge domain="task" status="review" />
                <StatusBadge domain="task" status="done" />
              </div>
              <p className="text-small text-muted-foreground font-mono">
                todo · in_progress · review · done
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-2">
              <p className="text-overline text-muted-foreground uppercase">
                Ticketstatus (klant ziet dit)
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge domain="ticket" status="new" />
                <StatusBadge domain="ticket" status="in_progress" />
                <StatusBadge domain="ticket" status="resolved" />
                <StatusBadge domain="ticket" status="closed" />
              </div>
              <p className="text-small text-muted-foreground font-mono">
                new · in_progress · resolved · closed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-2">
              <p className="text-overline text-muted-foreground uppercase">Prioriteit</p>
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority="low" />
                <PriorityBadge priority="medium" />
                <PriorityBadge priority="high" />
              </div>
              <p className="text-small text-muted-foreground font-mono">low · medium · high</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 7 · Kaarten */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">7 · Kaarten</h2>
          <p className="text-body text-muted-foreground">
            Drie vaste vormen: projectkaart, taakkaart voor het kanbanbord en statistiekkaart.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <InitialsAvatar
                  initials="MV"
                  className="bg-primary text-primary-foreground size-11"
                />
                <div>
                  <CardTitle>Herbouw site Meubelmakerij Verlinden</CardTitle>
                  <CardDescription>Verlinden &amp; Zn · Brugge</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge domain="task" status="in_progress" />
                <Badge className="bg-muted text-secondary-foreground hover:bg-muted">
                  4 taken vandaag
                </Badge>
              </div>
              <div className="border-border-subtle text-small flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground">Oplevering 21 okt</span>
                <span className="text-warning font-semibold">Wacht op feedback</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-small text-muted-foreground font-mono">TSK-318</span>
                <PriorityBadge priority="high" />
              </div>
              <CardTitle>Productfoto&apos;s optimaliseren voor mobiel</CardTitle>
              <CardDescription>Webshop De Groene Kruidenier</CardDescription>
              <div className="border-border-subtle text-small text-muted-foreground flex items-center justify-between border-t pt-3">
                <span>Vervalt 18 sep</span>
                <span>2 bijlagen</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-2">
              <p className="text-overline text-muted-foreground uppercase">Openstaande tickets</p>
              <p className="text-display font-display font-bold">7</p>
              <p className="text-small text-muted-foreground">
                3 nieuw deze week ·{' '}
                <span className="text-destructive font-semibold">1 hoge prioriteit</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 8 · Tabel */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">8 · Tabel</h2>
          <p className="text-body text-muted-foreground">
            Vanaf md een echte tabel, daaronder dezelfde rijen als aanraakbare kaarten. Nooit
            horizontaal scrollen op mobiel.
          </p>
        </div>

        <DataTable
          columns={ticketColumns}
          rows={demoTickets}
          getRowKey={(row) => row.id}
          renderMobileCard={(row) => (
            <Card>
              <CardContent className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-small text-muted-foreground font-mono">{row.id}</span>
                  <StatusBadge domain="ticket" status={row.status} />
                </div>
                <p className="font-semibold">{row.title}</p>
                <div className="text-small text-muted-foreground flex items-center justify-between">
                  <span>{row.client}</span>
                  <PriorityBadge priority={row.priority} />
                </div>
              </CardContent>
            </Card>
          )}
        />
      </section>

      {/* 9 · Lege staat */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">9 · Lege staat</h2>
          <p className="text-body text-muted-foreground">
            Geen illustraties: een kaderlijn, één zin uitleg en de actie die de lijst vult.
          </p>
        </div>
        <EmptyState
          title="Nog geen tickets voor dit project"
          description="Meldt u een probleem op de website, dan verschijnt het hier met de status en de opvolging."
          action={<Button>Bug melden</Button>}
        />
      </section>

      {/* 10 · Tabs, kruimelpad & gegevenslijst */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">10 · Tabs, kruimelpad &amp; gegevenslijst</h2>
          <p className="text-body text-muted-foreground">
            Ondersteunt de projectdetailpagina: onderstreepte tabs, een kruimelpad en een
            label-waardelijst voor projectgegevens.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-overline text-muted-foreground uppercase">Tabs</p>
              <Tabs defaultValue="overzicht">
                <TabsList>
                  <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
                  <TabsTrigger value="taken">Taken</TabsTrigger>
                  <TabsTrigger value="tickets">
                    Tickets{' '}
                    <Badge className="bg-muted text-secondary-foreground hover:bg-muted">3</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="documenten">Documenten</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-small text-muted-foreground">
                Op mobiel schuiven de tabs horizontaal; de actieve tab staat altijd links in beeld.
              </p>
              <div className="border-border-subtle flex flex-col gap-2 border-t pt-3">
                <p className="text-overline text-muted-foreground uppercase">Kruimelpad</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Projecten</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Verlinden &amp; Zn</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage>Herbouw website</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <p className="text-overline text-muted-foreground mb-2 uppercase">Gegevenslijst</p>
              <DataList
                items={[
                  { label: 'Klant', value: 'Verlinden & Zn' },
                  { label: 'Contactpersoon', value: 'Katrien Verlinden' },
                  { label: 'Startdatum', value: '4 aug 2026', mono: true },
                  { label: 'Budget', value: '€ 7.400', mono: true },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-overline text-muted-foreground uppercase">
                Lijstrij (agenda &amp; documenten)
              </p>
              <ListRow
                className="border-border-subtle border-b pb-3"
                leading={<DateBlock month="sep" day={18} />}
                title="Oplevering ontwerp bespreken"
                subtitle="10:00 – 11:00 · Videocall"
              />
              <FileRow
                typeLabel="PDF"
                name="Offerte herbouw website.pdf"
                meta="420 kB · 2 sep 2026"
                className="border-none px-0 py-0"
                action={<span className="text-small text-primary font-semibold">Openen</span>}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 11 · Navigatie */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2 font-display">11 · Navigatie</h2>
          <p className="text-body text-muted-foreground">
            Desktop: vaste zijbalk van 248px. Mobiel: bovenbalk met menuknop plus een tabbalk
            onderaan met vijf bestemmingen, klaar voor PWA-gebruik.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <Card className="w-full overflow-hidden py-0 sm:w-62">
            <div className="bg-sidebar flex flex-col">
              <div className="flex items-center gap-2 px-4 py-4">
                <div className="bg-primary text-small text-primary-foreground flex size-7 items-center justify-center rounded-md font-semibold">
                  S
                </div>
                <span className="font-display font-semibold">Studio</span>
              </div>
              <p className="text-overline text-muted-foreground px-4 pb-1 uppercase">Beheer</p>
              <nav className="flex flex-col gap-0.5 px-2">
                {[
                  { label: 'Dashboard', active: true },
                  { label: 'Klanten' },
                  { label: 'Projecten' },
                  { label: 'Takenbord' },
                  { label: 'Tickets', count: 7 },
                  { label: 'Agenda' },
                  { label: 'Documenten' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`text-body flex h-10 items-center justify-between rounded-md px-2.5 ${
                      item.active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                        : 'text-sidebar-foreground'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.count ? (
                      <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">
                        {item.count}
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </nav>
              <div className="border-sidebar-border mt-auto flex items-center gap-2 border-t px-4 py-3">
                <InitialsAvatar initials="JD" shape="circle" className="size-8 bg-neutral-200" />
                <div>
                  <p className="text-small font-medium">Jonas De Meyer</p>
                  <p className="text-small text-muted-foreground">Beheerder</p>
                </div>
              </div>
            </div>
          </Card>
          <Card className="w-full overflow-hidden py-0 sm:w-96">
            <div className="border-border-subtle flex h-12 items-center justify-between border-b px-4">
              <span className="text-body">☰</span>
              <span className="font-display font-semibold">Tickets</span>
              <span className="text-body">⌕</span>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {demoTickets.slice(0, 2).map((row) => (
                <div key={row.id} className="border-border-subtle rounded-lg border px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-small text-muted-foreground font-mono">{row.id}</span>
                    <StatusBadge domain="ticket" status={row.status} />
                  </div>
                  <p className="font-medium">{row.title}</p>
                </div>
              ))}
            </div>
            <div className="border-border-subtle mt-auto flex items-center justify-around border-t py-2">
              {[
                { label: 'Start', active: true },
                { label: 'Projecten' },
                { label: 'Taken' },
                { label: 'Tickets', count: 7 },
                { label: 'Agenda' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`text-small flex flex-col items-center gap-0.5 ${item.active ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                >
                  <span className="relative flex size-5 items-center justify-center rounded bg-neutral-200">
                    {item.count ? (
                      <span className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full text-[9px]">
                        {item.count}
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <p className="text-small text-muted-foreground">
          Het klantportaal gebruikt dezelfde navigatie met vier bestemmingen: Projecten, Tickets,
          Agenda en Documenten. Interne taken en het takenbord zijn daar niet aanwezig.
        </p>
      </section>
    </main>
  );
}
