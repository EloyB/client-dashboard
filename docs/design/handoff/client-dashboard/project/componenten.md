# Componenten — Studio (richting Atelier)

Alle componenten met hun varianten en de schermen waarin ze voorkomen. Elke variant verwijst naar tokens uit `globals.css`; er staan geen losse kleurwaarden in componentcode.

Ontworpen schermen (bestanden in dit project):

| Bestand | Zone |
|---|---|
| `App shell.dc.html` | beide · navigatie, paginakop, 404 en foutpagina |
| `Admin login.dc.html` | beheer · aanmelden, wachtwoord vergeten, opnieuw instellen |
| `Admin dashboard.dc.html` | beheer · startpagina |
| `Admin klanten.dc.html` | beheer · klantenlijst, klantdetail, gebruiker uitnodigen, klantformulier |
| `Admin projecten.dc.html` | beheer · projectenlijst en projectformulier |
| `Admin projectdetail.dc.html` | beheer · projectdetail met tabs |
| `Admin takenbord.dc.html` | beheer · kanbanbord |
| `Admin taken.dc.html` | beheer · takenlijst, taakformulier, al mijn taken |
| `Admin tickets.dc.html` | beheer · ticketlijst, ticketdetail, omzetten naar taak |
| `Admin agenda.dc.html` | beheer · maand, week, agendalijst, agenda-item |
| `Documenten.dc.html` | beide · documentenlijst, uploadpaneel, portaaloverzicht |
| `Klantportaal aanmelden.dc.html` | portaal · uitnodiging en aanmeldlink |
| `Klantportaal start.dc.html` | portaal · startpagina |
| `Klantportaal tickets.dc.html` | portaal · meldingenlijst en detail |
| `Klantportaal bug melden.dc.html` | portaal · melding maken |
| `Klantportaal agenda.dc.html` | portaal · agenda |
| `CRUD patronen.dc.html` | patronen · formulier, lijst, detail, feedback |
| `Design system.dc.html` | referentie |
| `emails/*.html` | verzendklare e-mails |

## Installeren

```bash
npx shadcn@latest add button input textarea select label checkbox switch card badge table \
  tabs breadcrumb dialog sheet popover dropdown-menu calendar separator scroll-area \
  sonner skeleton avatar progress sidebar
```

Extra: `lucide-react` (iconen), `@dnd-kit/core` + `@dnd-kit/sortable` (kanban), `react-hook-form` + `zod`, `date-fns` met locale `nl-BE`.

## Button

| Variant | Gebruik | Schermen |
|---|---|---|
| `default` | primaire actie | overal, max. één per kop |
| `outline` | secundaire actie | detailkoppen, filters, "Naar taak" |
| `secondary` | neutrale actie | filterbalken |
| `ghost` | annuleren, icoonknop | formulieren, kopbalken |
| `destructive` | verwijderen | bevestigingsdialoog |
| `inverse` (eigen) | witte knop op accentvlak | actiekaart klantportaal start |

Maten `sm` 32px, `default` 40px, `lg` 48px, `icon` 40×40; onder `md` minimaal 44px. Radius `rounded-lg`.

## Input / Textarea / Select

Hoogte 40px, mobiel 44px; `border-input`, `rounded-lg`, focus `ring-ring`. Fout: `border-destructive` plus hulptekst in `text-destructive`.

Select-varianten:
- **veldselect** — formulieren (klant, status, prioriteit, soort, project)
- **filterselect** 34–36px, `font-semibold` — lijstkoppen (klant, project, sorteren)
- **statusselect** gekleurd naar de status, 34px / mobiel 44px — takenlijst, kanban op mobiel

Gebruikt in: alle formulieren, `Admin taken`, `Admin takenbord`, `Admin tickets`, alle lijstkoppen.

## Checkbox / Switch

Checkbox 18px (mobiel 20px), gevuld `bg-primary` met wit vinkje. Switch 38×22px, `bg-primary` aan / `bg-neutral-300` uit, altijd met een hulpregel die de gevolgen beschrijft.

Switches in gebruik: "zichtbaar voor klant" (document, agenda-item, project), "hele dag" (agenda-item), "gearchiveerde tonen" (projectenlijst), "alleen gedeeld" (documentenlijst), "aangemeld blijven" (login), "klant verwittigen" (ticketdetail).

## Datum en tijd

- **datumveld** — 40/44px met kalendericoon, opent `Calendar` (locale nl-BE, ma–zo, vandaag gemarkeerd, selectie in accent)
- **tijdveld** 112px breed naast het datumveld; verdwijnt bij "hele dag"
- **datumstrook** — mobiele agenda, zeven dagen met stip bij items
- **maandkiezer in sheet** — mobiele agenda, knop ▦

## Bestandsupload

Gestippelde zone (`border-dashed`, `bg-neutral-50`) op desktop; op mobiel drie knoppen van 44px: Bestanden, Foto's, Foto maken (`accept="image/*"`, `capture="environment"`). Statussen: leeg, bezig met voortgangsbalk, geüpload (balk in `success`), fout (`destructive-muted` met twee uitwegen). Bestandsrij met type-tegel, naam, grootte en verwijderknop.

Gebruikt in: `Documenten` (uploadpaneel), `Klantportaal bug melden`, `CRUD patronen` (formulier).

## Badge

Statusbadges gevuld en `rounded-full`; prioriteit met rand plus stip.

**Taakstatus** — `todo` `bg-muted` · `in_progress` `bg-accent` · `review` `bg-warning-muted` · `done` `bg-success-muted`
**Ticketstatus (intern)** — `new` `bg-info-muted` · `in_progress` `bg-accent` · `resolved` `bg-success-muted` · `closed` `bg-muted`
**Ticketstatus (portaal)** — zelfde kleuren, andere woorden: Ontvangen · We zijn ermee bezig · Opgelost · Afgesloten
**Projectstatus** — `planned` `bg-info-muted` · `active` `bg-accent` · `maintenance` `bg-muted` · `completed` `bg-success-muted` · `archived` `bg-muted` + `text-neutral-400`
**Prioriteit** — `low` `border-border` + stip `neutral-400` · `medium` `border-warning-border` · `high` `border-destructive-border`
**Documentsoort** — factuur `bg-info-muted` · offerte `bg-warning-muted` · contract `bg-accent` · andere `bg-muted`
**Zichtbaarheid** — Gedeeld `bg-success-muted` · Intern `bg-muted`
**Gebruikersstatus** — Actief `bg-success-muted` · Uitgenodigd `bg-warning-muted`

Altijd `whitespace-nowrap`. Portaal gebruikt nooit de zichtbaarheidsbadge.

## Type-markering (agenda)

Vorm in plaats van kleur alleen: deadline = balkje 4×12px, overleg = cirkel 8px, mijlpaal = ruit 8px, andere = vierkant 8px. Achterstallige deadline wordt `destructive` plus doorstreepte titel.

Gebruikt in: `Admin agenda` (maand, week, lijst, popover, formulier), `Klantportaal agenda`.

## Card

| Variant | Toepassing | Schermen |
|---|---|---|
| Sectiekaart | kop met titel + tekstactie, daarna rijen | dashboard, projectdetail, alle detailpagina's |
| Projectkaart | avatar, titel, klant, statusbadges, voetregel | projectenlijst mobiel, projectdetail |
| Taakkaart | ID, prioriteit, titel, vervaldatum | kanbanbord, takenlijst mobiel |
| Statistiekkaart | overline, getal `font-display`, ondertitel | projectdetail (4 stuks) |
| Actiekaart | accentvlak, witte knop, max. één per pagina | klantportaal start |
| Authenticatiekaart | 420–520px gecentreerd op neutrale grond | login, aanmeldlink |
| Lijstrijkaart (mobiel) | tabelrij als kaart | alle lijsten onder `md` |

Radius `rounded-xl` (14px), `shadow-card`, padding 16px mobiel / 18–24px desktop.

## Table + mobiele kaartvariant

Desktop `md:` en hoger: kopbalk `bg-neutral-50`, rijhoogte 48px, hover `bg-neutral-50`, kolomtracks `minmax()` zodat badges niet afbreken. Sorteerbare kop met caret. Onder `md` dezelfde data als kaartlijst; nooit horizontaal scrollen.

Gebruikt in: klantenlijst, projectenlijst, ticketlijst (beheer), documentenlijst, takenlijst, dashboard (nieuwe tickets, actieve projecten).

## Tabs

Onderstreept: actief `border-b-2 border-primary text-primary font-semibold`. Optionele aantal-chip. Mobiel horizontaal scrollbaar.

Gebruikt in: projectdetail (Overzicht · Taken · Tickets · Documenten), portaalagenda (Komende · Voorbij), login-demo.

Segmented toggle (aparte vorm): `bg-muted` met witte actieve pil — Lijst/Bord in `Admin taken`, Maand/Week in `Admin agenda`.

## Filterpil (chip)

`rounded-full`, actief `bg-neutral-900 text-white`, inactief wit met `border-border-strong`; optioneel aantal of type-markering erin. Mobiel 36px hoog.

Gebruikt in: alle lijsten met status-, prioriteit-, type- of soortfilter; kanban-statuswissel op mobiel.

## Kanbanbord

Vier kolommen, kolomlichaam `bg-surface-sunken`, `rounded-lg`. Drag-and-drop met `@dnd-kit`; dropzone `bg-accent` + `border-primary`, gesleepte kaart `opacity-40`. Mobiel: pillenrij met aantallen (gelijke breedte) plus statusselect per kaart.

## Popover / Sheet / Dialog

- **Popover** 400px — agenda-itemdetail op desktop
- **Zijpaneel (Sheet, rechts)** 440–470px — taak, agenda-item, gebruiker uitnodigen, document uploaden, omzetten naar taak
- **Bodemsheet (Sheet, onder)** — dezelfde formulieren op mobiel, plus navigatiemenu en maandkiezer
- **Dialog** 340–400px — één beslissing: hernoemen, verwijderen, archiveren
- **Lightbox** — schermafbeelding op volle grootte (portaal en beheer)

Elk paneel: kop met titel + sluitkruis, scrollend midden, vaste voet met acties (primair rechts op desktop, gestapeld op mobiel).

## Feedback

Toast rechtsonder (mobiel bovenaan) met 3px linkerrand in de semantische kleur; succes verdwijnt na 4s, fout blijft met herhaalactie. Bevestigingsdialoog: verwijderen vraagt de naam te typen, archiveren niet. Skeleton op rijniveau met `bg-skeleton` / `bg-skeleton-soft`. Voortgangsbalk 6px.

## Lege staten

| Variant | Wanneer | Voorbeeld |
|---|---|---|
| Positief | leeg is goed nieuws | "Geen nieuwe tickets · alles is opgevolgd" |
| Neutraal | niets gepland in deze periode | "Niets gepland deze week" |
| Uitnodigend | eerste item aanmaken | "Nog geen documenten" + knop |
| Filterresultaat | filters leveren niets op | "Geen tickets met deze filters" + Filters wissen |

Geen illustraties. In het portaal altijd de vriendelijke toon en het groene vinkje bij goed nieuws.

## Navigatie

**Desktop** — `Sidebar` 248px, inklapbaar naar 68px (alleen iconen, teller wordt een stip). Actief item `bg-sidebar-accent text-sidebar-accent-foreground font-semibold`. Voetblok met avatar en gebruikersmenu (Profiel, Instellingen, Afmelden). Portaal heeft daarboven een klantblok met bedrijfsnaam en de vaste actie "Bug melden".

**Mobiel** — bovenbalk met terug/menu (40px) en titel; tabbalk onderaan met `pb-[env(safe-area-inset-bottom)]`. Beheer vijf bestemmingen (Start, Projecten, Taken, Tickets, Agenda) met de rest achter ☰; portaal vier (Start/Projecten, Tickets, Agenda, Documenten).

**Kruimelpad** — laatste niveau `text-foreground font-semibold`, scheidingsteken `/` in `text-neutral-300`.

## Paginakop

Kruimelpad, titel `h1`, optionele statusbadges, rechts één primaire actie plus een overloopmenu (⋯) voor de rest. Destructieve acties staan enkel in dat menu. Op mobiel verhuist de primaire actie naar een volle-breedte knop onder de kopbalk.

## Gegevenslijst en lijstrij

Gegevenslijst: label links `text-muted-foreground`, waarde rechts uitgelijnd, bedragen en datums in `font-mono`, rijen met `border-border-subtle`.

Lijstrijvarianten: agenda (datumblokje links), document (type-tegel, naam, grootte, actie), gebruiker (avatar, naam, status, acties), tijdlijn (stip plus tekst en tijdstip).

## Iconografie

`lucide-react`, 16px in navigatie en knoppen, 20px in kopbalken, `stroke-width: 1.75`. In de ontwerpen staan tijdelijke tekstglyphs (◧ ▤ ◇ ◫ ◎ ▦ ▣) op de plek van deze iconen.
