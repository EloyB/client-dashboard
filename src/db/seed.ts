import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';

import { db } from '@/db';
import {
  account,
  clients,
  documents,
  events,
  files,
  projects,
  tasks,
  ticketAttachments,
  tickets,
  user,
  type DocumentType,
  type EventType,
  type Priority,
  type ProjectStatus,
  type TaskStatus,
  type TicketStatus,
} from '@/db/schema';

// Inserts directly instead of going through auth.api.signUpEmail: the admin
// login (slice 1a) disables public sign-up, and that flag also blocks
// signUpEmail when called in-process, not just over HTTP.
async function findOrCreateAdmin(input: { name: string; email: string; password: string }) {
  const [existing] = await db.select().from(user).where(eq(user.email, input.email)).limit(1);
  if (existing) {
    return existing;
  }

  const [admin] = await db
    .insert(user)
    .values({ name: input.name, email: input.email, role: 'admin', emailVerified: true })
    .returning();

  await db.insert(account).values({
    accountId: admin.id,
    providerId: 'credential',
    userId: admin.id,
    password: await hashPassword(input.password),
  });

  return admin;
}

async function findOrCreateClient(input: {
  name: string;
  email: string;
  vatNumber?: string;
  phone?: string;
  address?: string;
}) {
  const [existing] = await db.select().from(clients).where(eq(clients.email, input.email)).limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db.insert(clients).values(input).returning();
  return created;
}

async function findOrCreateClientUser(input: {
  name: string;
  email: string;
  clientId: string;
  emailVerified?: boolean;
}) {
  const [existing] = await db.select().from(user).where(eq(user.email, input.email)).limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(user)
    .values({
      name: input.name,
      email: input.email,
      clientId: input.clientId,
      role: 'client',
      emailVerified: input.emailVerified ?? true,
    })
    .returning();

  return created;
}

async function findOrCreateProject(input: {
  clientId: string;
  name: string;
  description: string;
  websiteUrl: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string | null;
}) {
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.clientId, input.clientId), eq(projects.name, input.name)))
    .limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db.insert(projects).values(input).returning();
  return created;
}

async function findOrCreateTask(input: {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  position: string;
}) {
  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, input.projectId), eq(tasks.title, input.title)))
    .limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db.insert(tasks).values(input).returning();
  return created;
}

async function findOrCreateTicket(input: {
  projectId: string;
  reportedById: string;
  title: string;
  description: string;
  pageUrl: string;
  status: TicketStatus;
  priority: Priority;
}) {
  const [existing] = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.projectId, input.projectId), eq(tickets.title, input.title)))
    .limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db.insert(tickets).values(input).returning();
  return created;
}

async function findOrCreateEvent(input: {
  projectId: string;
  title: string;
  description: string;
  type: EventType;
  startsAt: Date;
  endsAt: Date;
  visibleToClient: boolean;
}) {
  const [existing] = await db
    .select()
    .from(events)
    .where(and(eq(events.projectId, input.projectId), eq(events.title, input.title)))
    .limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db.insert(events).values(input).returning();
  return created;
}

async function findOrCreateFile(input: {
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedById: string;
}) {
  const [existing] = await db
    .select()
    .from(files)
    .where(eq(files.storageKey, input.storageKey))
    .limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db.insert(files).values(input).returning();
  return created;
}

async function findOrCreateDocument(input: {
  projectId: string;
  fileId: string;
  title: string;
  type: DocumentType;
  visibleToClient: boolean;
}) {
  const [existing] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.projectId, input.projectId), eq(documents.title, input.title)))
    .limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db.insert(documents).values(input).returning();
  return created;
}

async function attachFileToTicket(ticketId: string, fileId: string) {
  await db.insert(ticketAttachments).values({ ticketId, fileId }).onConflictDoNothing();
}

async function seed() {
  const admin = await findOrCreateAdmin({
    name: 'Eloy Boone',
    email: 'eloy@studioswyft.be',
    password: 'AdminWachtwoord123!',
  });

  const verlinden = await findOrCreateClient({
    name: 'Meubelmakerij Verlinden',
    email: 'info@verlinden-zn.be',
    vatNumber: 'BE0652.123.456',
    phone: '03 456 78 90',
    address: 'Steenweg op Antwerpen 12, 2900 Schoten',
  });

  const katrien = await findOrCreateClientUser({
    name: 'Katrien Verlinden',
    email: 'katrien@verlinden-zn.be',
    clientId: verlinden.id,
  });

  const tom = await findOrCreateClientUser({
    name: 'Tom Verlinden',
    email: 'tom@verlinden-zn.be',
    clientId: verlinden.id,
  });

  const herbouwWebsite = await findOrCreateProject({
    clientId: verlinden.id,
    name: 'Herbouw website',
    description: 'Volledige herbouw van de bedrijfswebsite met Payload CMS.',
    websiteUrl: 'https://verlinden-zn.be',
    status: 'active',
    startDate: '2026-08-04',
    dueDate: '2026-10-21',
  });

  const webshopOnderhoud = await findOrCreateProject({
    clientId: verlinden.id,
    name: 'Webshop onderhoud',
    description: 'Maandelijks onderhoud van de bestaande webshop.',
    websiteUrl: 'https://shop.verlinden-zn.be',
    status: 'maintenance',
    startDate: '2025-01-15',
    dueDate: null,
  });

  let position = generateKeyBetween(null, null);
  await findOrCreateTask({
    projectId: herbouwWebsite.id,
    title: 'Homepage layout afwerken',
    description: 'Hero, projectenoverzicht en footer volgens het ontwerp.',
    status: 'done',
    priority: 'medium',
    position,
  });

  position = generateKeyBetween(position, null);
  await findOrCreateTask({
    projectId: herbouwWebsite.id,
    title: 'Contactformulier koppelen aan e-mail',
    description: 'Formulier moet een bevestigingsmail sturen naar de klant.',
    status: 'in_progress',
    priority: 'high',
    position,
  });

  position = generateKeyBetween(position, null);
  await findOrCreateTask({
    projectId: herbouwWebsite.id,
    title: 'SEO-teksten schrijven',
    description: 'Meta-omschrijvingen en paginateksten voor de belangrijkste pagina’s.',
    status: 'todo',
    priority: 'low',
    position,
  });

  await findOrCreateTask({
    projectId: webshopOnderhoud.id,
    title: 'Maandelijkse back-up controleren',
    description: 'Nagaan of de automatische back-up van september geslaagd is.',
    status: 'todo',
    priority: 'medium',
    position: generateKeyBetween(null, null),
  });

  const contactformulierTicket = await findOrCreateTicket({
    projectId: herbouwWebsite.id,
    reportedById: katrien.id,
    title: 'Contactformulier verzendt niet',
    description: 'Bij het versturen van het contactformulier verschijnt een foutmelding.',
    pageUrl: 'https://verlinden-zn.be/contact',
    status: 'new',
    priority: 'high',
  });

  await findOrCreateTicket({
    projectId: herbouwWebsite.id,
    reportedById: tom.id,
    title: 'Logo te klein op tablet',
    description: 'Op een iPad is het logo in de header nauwelijks leesbaar.',
    pageUrl: 'https://verlinden-zn.be',
    status: 'resolved',
    priority: 'low',
  });

  await findOrCreateTicket({
    projectId: webshopOnderhoud.id,
    reportedById: katrien.id,
    title: 'Betaalmodule geeft foutmelding',
    description: 'Klanten kunnen niet afrekenen met Bancontact.',
    pageUrl: 'https://shop.verlinden-zn.be/checkout',
    status: 'in_progress',
    priority: 'high',
  });

  await findOrCreateEvent({
    projectId: herbouwWebsite.id,
    title: 'Kickoff meeting',
    description: 'Startvergadering met de klant over scope en planning.',
    type: 'meeting',
    startsAt: new Date('2026-08-04T09:00:00+02:00'),
    endsAt: new Date('2026-08-04T10:00:00+02:00'),
    visibleToClient: true,
  });

  await findOrCreateEvent({
    projectId: herbouwWebsite.id,
    title: 'Interne review vóór oplevering',
    description: 'Laatste controle van het team voordat de klant de site te zien krijgt.',
    type: 'other',
    startsAt: new Date('2026-10-18T14:00:00+02:00'),
    endsAt: new Date('2026-10-18T15:00:00+02:00'),
    visibleToClient: false,
  });

  await findOrCreateEvent({
    projectId: webshopOnderhoud.id,
    title: 'Maandelijkse check-in',
    description: 'Bespreking van de openstaande tickets en statistieken.',
    type: 'meeting',
    startsAt: new Date('2026-09-22T11:00:00+02:00'),
    endsAt: new Date('2026-09-22T11:30:00+02:00'),
    visibleToClient: true,
  });

  await findOrCreateEvent({
    projectId: herbouwWebsite.id,
    title: 'Oplevering',
    description: 'Website gaat live en wordt overgedragen aan de klant.',
    type: 'deadline',
    startsAt: new Date('2026-10-21T09:00:00+02:00'),
    endsAt: new Date('2026-10-21T09:00:00+02:00'),
    visibleToClient: true,
  });

  const offerteFile = await findOrCreateFile({
    storageKey: 'seed/verlinden/offerte-herbouw-website.pdf',
    filename: 'Offerte herbouw website.pdf',
    mimeType: 'application/pdf',
    size: 245_760,
    uploadedById: admin.id,
  });

  await findOrCreateDocument({
    projectId: herbouwWebsite.id,
    fileId: offerteFile.id,
    title: 'Offerte herbouw website.pdf',
    type: 'quote',
    visibleToClient: true,
  });

  const hostingNotesFile = await findOrCreateFile({
    storageKey: 'seed/verlinden/interne-notities-hosting.pdf',
    filename: 'Interne notities hosting.pdf',
    mimeType: 'application/pdf',
    size: 51_200,
    uploadedById: admin.id,
  });

  await findOrCreateDocument({
    projectId: herbouwWebsite.id,
    fileId: hostingNotesFile.id,
    title: 'Interne notities hosting.pdf',
    type: 'other',
    visibleToClient: false,
  });

  const onderhoudFactuurFile = await findOrCreateFile({
    storageKey: 'seed/verlinden/factuur-onderhoud-september.pdf',
    filename: 'Factuur onderhoud september.pdf',
    mimeType: 'application/pdf',
    size: 38_400,
    uploadedById: admin.id,
  });

  await findOrCreateDocument({
    projectId: webshopOnderhoud.id,
    fileId: onderhoudFactuurFile.id,
    title: 'Factuur onderhoud september.pdf',
    type: 'invoice',
    visibleToClient: true,
  });

  const contactformulierScreenshot = await findOrCreateFile({
    storageKey: 'seed/verlinden/screenshot-contactformulier-fout.png',
    filename: 'screenshot-contactformulier-fout.png',
    mimeType: 'image/png',
    size: 128_000,
    uploadedById: katrien.id,
  });

  await attachFileToTicket(contactformulierTicket.id, contactformulierScreenshot.id);

  const vermeulen = await findOrCreateClient({
    name: 'Bakkerij Vermeulen',
    email: 'info@bakkerijvermeulen.be',
    vatNumber: 'BE0789.456.123',
    phone: '03 234 56 78',
    address: 'Dorpsstraat 5, 2970 Schilde',
  });

  const sofie = await findOrCreateClientUser({
    name: 'Sofie Vermeulen',
    email: 'sofie@bakkerijvermeulen.be',
    clientId: vermeulen.id,
  });

  const pieter = await findOrCreateClientUser({
    name: 'Pieter Vermeulen',
    email: 'pieter@bakkerijvermeulen.be',
    clientId: vermeulen.id,
  });

  const nieuweWebsite = await findOrCreateProject({
    clientId: vermeulen.id,
    name: 'Nieuwe website',
    description: 'Nieuwe website met onlinebestelling voor afhaling.',
    websiteUrl: 'https://bakkerijvermeulen.be',
    status: 'planned',
    startDate: '2026-10-05',
    dueDate: '2026-12-15',
  });

  const instagramIntegratie = await findOrCreateProject({
    clientId: vermeulen.id,
    name: 'Instagram integratie',
    description: 'Instagram-feed tonen op de homepage.',
    websiteUrl: 'https://bakkerijvermeulen.be',
    status: 'completed',
    startDate: '2026-05-01',
    dueDate: '2026-06-01',
  });

  await findOrCreateEvent({
    projectId: nieuweWebsite.id,
    title: 'Kick-off gesprek',
    description: 'Startgesprek met de klant over scope en planning.',
    type: 'deadline',
    startsAt: new Date('2026-10-05T10:00:00+02:00'),
    endsAt: new Date('2026-10-05T10:00:00+02:00'),
    visibleToClient: true,
  });

  await findOrCreateTask({
    projectId: nieuweWebsite.id,
    title: 'Wireframes goedkeuren',
    description: 'Feedback van de klant op de wireframes verwerken.',
    status: 'review',
    priority: 'medium',
    position: generateKeyBetween(null, null),
  });

  await findOrCreateTask({
    projectId: instagramIntegratie.id,
    title: 'Instagram API koppelen',
    description: 'Toegangstoken instellen en feed testen.',
    status: 'done',
    priority: 'medium',
    position: generateKeyBetween(null, null),
  });

  await findOrCreateTicket({
    projectId: nieuweWebsite.id,
    reportedById: sofie.id,
    title: 'Vraag over openingsuren-widget',
    description: 'Kan de widget ook feestdagen tonen?',
    pageUrl: 'https://bakkerijvermeulen.be',
    status: 'new',
    priority: 'low',
  });

  await findOrCreateTicket({
    projectId: instagramIntegratie.id,
    reportedById: pieter.id,
    title: "Foto's laden traag",
    description: 'De Instagram-feed op de homepage laadt merkbaar traag.',
    pageUrl: 'https://bakkerijvermeulen.be',
    status: 'closed',
    priority: 'medium',
  });

  await findOrCreateEvent({
    projectId: nieuweWebsite.id,
    title: 'Startvergadering',
    description: 'Kennismaking en bespreking van de wensen voor de nieuwe website.',
    type: 'meeting',
    startsAt: new Date('2026-10-05T10:00:00+02:00'),
    endsAt: new Date('2026-10-05T11:00:00+02:00'),
    visibleToClient: true,
  });

  await findOrCreateEvent({
    projectId: instagramIntegratie.id,
    title: 'Opleveringsgesprek',
    description: 'De werkende integratie tonen en overdragen aan de klant.',
    type: 'milestone',
    startsAt: new Date('2026-06-01T15:00:00+02:00'),
    endsAt: new Date('2026-06-01T15:30:00+02:00'),
    visibleToClient: true,
  });

  const voorstelFile = await findOrCreateFile({
    storageKey: 'seed/vermeulen/voorstel-nieuwe-website.pdf',
    filename: 'Voorstel nieuwe website.pdf',
    mimeType: 'application/pdf',
    size: 189_440,
    uploadedById: admin.id,
  });

  await findOrCreateDocument({
    projectId: nieuweWebsite.id,
    fileId: voorstelFile.id,
    title: 'Voorstel nieuwe website.pdf',
    type: 'quote',
    visibleToClient: true,
  });

  const instagramFactuurFile = await findOrCreateFile({
    storageKey: 'seed/vermeulen/factuur-instagram-integratie.pdf',
    filename: 'Factuur Instagram integratie.pdf',
    mimeType: 'application/pdf',
    size: 32_768,
    uploadedById: admin.id,
  });

  await findOrCreateDocument({
    projectId: instagramIntegratie.id,
    fileId: instagramFactuurFile.id,
    title: 'Factuur Instagram integratie.pdf',
    type: 'invoice',
    visibleToClient: true,
  });

  // Extra clients purely for slice 2a (overview pagination beyond one page,
  // and the empty/invited states the detail page needs to show correctly) —
  // deliberately without tasks/events/documents, which those slices don't need.
  const haarwerk = await findOrCreateClient({
    name: 'Kapsalon Haarwerk',
    email: 'info@kapsalonhaarwerk.be',
    vatNumber: 'BE0456.789.012',
    phone: '09 234 56 78',
    address: 'Kerkstraat 8, 9000 Gent',
  });
  const annHaarwerk = await findOrCreateClientUser({
    name: 'Ann Haarwerk',
    email: 'ann@kapsalonhaarwerk.be',
    clientId: haarwerk.id,
  });
  const haarwerkWebsite = await findOrCreateProject({
    clientId: haarwerk.id,
    name: 'Nieuwe website',
    description: 'Afsprakenmodule en portfolio.',
    websiteUrl: 'https://kapsalonhaarwerk.be',
    status: 'active',
    startDate: '2026-07-01',
    dueDate: '2026-11-15',
  });
  await findOrCreateTicket({
    projectId: haarwerkWebsite.id,
    reportedById: annHaarwerk.id,
    title: 'Afsprakenmodule stuurt geen bevestiging',
    description: 'Klanten krijgen geen bevestigingsmail na het boeken van een afspraak.',
    pageUrl: 'https://kapsalonhaarwerk.be/afspraak',
    status: 'new',
    priority: 'high',
  });
  await findOrCreateTicket({
    projectId: haarwerkWebsite.id,
    reportedById: annHaarwerk.id,
    title: 'Logo staat scheef op de startpagina',
    description: 'Op sommige schermen staat het logo niet gecentreerd.',
    pageUrl: 'https://kapsalonhaarwerk.be',
    status: 'resolved',
    priority: 'low',
  });

  const novum = await findOrCreateClient({
    name: 'Drukkerij Novum',
    email: 'info@drukkerijnovum.be',
    vatNumber: 'BE0567.890.123',
    phone: '011 22 33 44',
    address: 'Industrielaan 20, 3500 Hasselt',
  });
  const marcNovum = await findOrCreateClientUser({
    name: 'Marc Novum',
    email: 'marc@drukkerijnovum.be',
    clientId: novum.id,
  });
  const novumWebshop = await findOrCreateProject({
    clientId: novum.id,
    name: 'Webshop lancering',
    description: 'Onlinebestelling voor drukwerk op maat.',
    websiteUrl: 'https://drukkerijnovum.be',
    status: 'active',
    startDate: '2026-06-01',
    dueDate: '2026-12-01',
  });
  await findOrCreateTicket({
    projectId: novumWebshop.id,
    reportedById: marcNovum.id,
    title: 'Prijsberekening klopt niet bij grote oplages',
    description: 'Vanaf 500 stuks toont de tool een verkeerde totaalprijs.',
    pageUrl: 'https://drukkerijnovum.be/bestellen',
    status: 'in_progress',
    priority: 'medium',
  });
  await findOrCreateEvent({
    projectId: novumWebshop.id,
    title: 'Lancering',
    description: 'Webshop gaat live voor alle klanten.',
    type: 'deadline',
    startsAt: new Date('2026-12-01T09:00:00+01:00'),
    endsAt: new Date('2026-12-01T09:00:00+01:00'),
    visibleToClient: true,
  });

  const deTrapper = await findOrCreateClient({
    name: 'Fietsenwinkel De Trapper',
    email: 'info@detrapper.be',
    vatNumber: 'BE0678.901.234',
    phone: '03 345 67 89',
    address: 'Stationsstraat 3, 2600 Berchem',
  });
  await findOrCreateClientUser({
    name: 'Lies Trapper',
    email: 'lies@detrapper.be',
    clientId: deTrapper.id,
    emailVerified: false,
  });
  const trapperWebsite = await findOrCreateProject({
    clientId: deTrapper.id,
    name: 'Herbouw website',
    description: 'Volledige herbouw met voorraadoverzicht.',
    websiteUrl: 'https://detrapper.be',
    status: 'completed',
    startDate: '2025-09-01',
    dueDate: '2026-01-15',
  });
  await findOrCreateTicket({
    projectId: trapperWebsite.id,
    reportedById: annHaarwerk.id,
    title: 'Contactformulier gaf foutmelding (opgelost)',
    description: 'Was tijdelijk stuk door een verkeerde instelling op de server.',
    pageUrl: 'https://detrapper.be/contact',
    status: 'closed',
    priority: 'low',
  });

  const groenrijk = await findOrCreateClient({
    name: 'Tuinaanleg Groenrijk',
    email: 'info@groenrijk.be',
    vatNumber: 'BE0789.012.345',
    phone: '053 45 67 89',
    address: 'Groenstraat 15, 9400 Ninove',
  });
  const janGroenrijk = await findOrCreateClientUser({
    name: 'Jan Groenrijk',
    email: 'jan@groenrijk.be',
    clientId: groenrijk.id,
  });
  await findOrCreateClientUser({
    name: 'Eva Groenrijk',
    email: 'eva@groenrijk.be',
    clientId: groenrijk.id,
  });
  const groenrijkWebsite = await findOrCreateProject({
    clientId: groenrijk.id,
    name: 'Projectenoverzicht met foto’s',
    description: 'Voor- en nafoto’s van gerealiseerde tuinaanleg.',
    websiteUrl: 'https://groenrijk.be',
    status: 'active',
    startDate: '2026-05-01',
    dueDate: '2026-10-01',
  });
  await findOrCreateTicket({
    projectId: groenrijkWebsite.id,
    reportedById: janGroenrijk.id,
    title: 'Foto’s laden niet op mobiel',
    description: 'De galerij blijft leeg op een smartphone.',
    pageUrl: 'https://groenrijk.be/realisaties',
    status: 'new',
    priority: 'medium',
  });
  await findOrCreateTicket({
    projectId: groenrijkWebsite.id,
    reportedById: janGroenrijk.id,
    title: 'Offerteformulier stuurt niet door naar juiste e-mail',
    description: 'Aanvragen komen niet aan bij de juiste medewerker.',
    pageUrl: 'https://groenrijk.be/offerte',
    status: 'new',
    priority: 'high',
  });

  // Deliberately minimal: no projects, no users, no optional fields — the
  // client the empty-state and "missing field" screens are tested against.
  await findOrCreateClient({
    name: 'Advocatenkantoor Peeters',
    email: 'info@advocatenpeeters.be',
  });

  console.log('Seed voltooid.');
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
