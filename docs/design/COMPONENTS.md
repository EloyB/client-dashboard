# Componenten — Studio (richting Atelier)

shadcn/ui-componenten met de varianten zoals gebruikt in de ontwerpen. Elke variant verwijst naar tokens uit `globals.css`; er staan geen losse kleurwaarden in de componentcode.

## Installeren

```bash
npx shadcn@latest add button input textarea select label card badge table tabs \
  breadcrumb dialog sheet dropdown-menu separator scroll-area sonner skeleton avatar progress
```

Extra: `lucide-react` (iconen), `@dnd-kit/core` + `@dnd-kit/sortable` (kanban), `react-hook-form` + `zod` (formulieren), `date-fns` met locale `nl-BE` (datums).

## Button

| Variant       | Gebruik                                              | Tokens                                                             |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `default`     | Primaire actie (Project aanmaken, Melding versturen) | `bg-primary` / `text-primary-foreground`, hover `bg-primary-hover` |
| `outline`     | Secundaire actie (Bewerken)                          | `border-border-strong`, hover `bg-neutral-50`                      |
| `secondary`   | Filters en neutrale acties                           | `bg-secondary` / `text-secondary-foreground`                       |
| `ghost`       | Annuleren, icoonknoppen in kopbalken                 | transparant, hover `bg-muted`                                      |
| `destructive` | Verwijderen                                          | `bg-destructive` / `text-destructive-foreground`                   |

Maten: `sm` 32px, `default` 40px, `lg` 48px, `icon` 40×40. Onder `md` schaalt alles naar minimaal 44px. Radius `rounded-lg`.

## Input / Textarea / Select

Eén visuele behandeling: hoogte 40px (44px mobiel), `border-input`, `rounded-lg`, focus `ring-ring`. Textarea `resize-vertical` op desktop, `resize-none` op mobiel. Foutstaat: `border-destructive` plus hulptekst in `text-destructive`. Hulptekst zonder fout in `text-muted-foreground`.

Select wordt gebruikt voor: pagina-keuze in de bugmelding, en als statuswissel op de mobiele taakkaart (44px, volledige breedte).

## Bestandsupload

Geen shadcn-component. Gestippelde zone (`border-dashed border-neutral-300`, `bg-neutral-50`) met `<input type="file" accept="image/*">`; op mobiel twee knoppen naast elkaar: "Uit galerij" (`accept="image/*"`) en "Foto maken" (`capture="environment"`). Geüploade bestanden verschijnen als rij met type-tegel, naam, grootte en verwijderknop.

## Badge

Statusbadges zijn gevuld en `rounded-full`. Prioriteit wijkt bewust af: rand plus gekleurde stip, zodat status en prioriteit naast elkaar leesbaar blijven.

**Taakstatus (intern)** — `todo` `bg-muted`/`text-secondary-foreground` · `in_progress` `bg-accent`/`text-accent-foreground` · `review` `bg-warning-muted`/`text-warning` · `done` `bg-success-muted`/`text-success`

**Ticketstatus (zichtbaar voor klant)** — `new` `bg-info-muted`/`text-info` · `in_progress` `bg-accent`/`text-accent-foreground` · `resolved` `bg-success-muted`/`text-success` · `closed` `bg-muted`/`text-neutral-500`

**Prioriteit** — `low` `border-border` + stip `neutral-400` · `medium` `border-warning-border`/`text-warning` + stip `warning-solid` · `high` `border-destructive-border`/`text-destructive` + stip `destructive`

**Zichtbaarheid documenten** — `Gedeeld` `bg-success-muted`/`text-success` · `Intern` `bg-muted`/`text-secondary-foreground`

Badges krijgen altijd `whitespace-nowrap`.

## Card

| Variant         | Toepassing                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------ |
| Projectkaart    | avatar-initialen, titel, klant, statusbadges, voetregel met deadline                       |
| Taakkaart       | ID mono, prioriteitsbadge, titel, vervaldatum (rood bij vervallen); `done` op `opacity-72` |
| Statistiekkaart | overline-label, getal in `font-display` 28–34px, ondertitel                                |
| Sectiekaart     | kop met titel + tekstactie rechts, `border-b border-border-subtle`, daarna lijstrijen      |

Radius `rounded-xl` (14px), `shadow-card`, padding 16px mobiel / 18–24px desktop.

## Table + mobiele kaartvariant

Desktop (`md:` en hoger): `Table` met kopbalk op `bg-neutral-50`, rijhoogte 48px, hover `bg-neutral-50`, kolomtracks als `minmax()` zodat badges nooit afbreken. Onder `md` rendert dezelfde data als kaartlijst (`md:hidden` / `hidden md:block`): ID en status bovenaan, titel, dan meta plus prioriteit. Nooit horizontaal scrollen.

Gebruikt voor: ticketlijst, documentenlijst.

## Tabs

Onderstreepte variant: actieve tab `border-b-2 border-primary text-primary font-semibold`, inactief `text-neutral-500`. Optioneel aantal-chip achter het label. Mobiel horizontaal scrollbaar met de actieve tab links.

Gebruikt op projectdetail: Overzicht · Taken · Tickets · Documenten.

## Kanbanbord

Vier kolommen (`todo`, `in_progress`, `review`, `done`) in een grid; kolomlichaam `bg-neutral-200/60`, `rounded-lg`. Drag-and-drop met `@dnd-kit`; actieve dropzone krijgt `bg-accent` plus `border-primary`, de gesleepte kaart `opacity-40`. Mobiel: pillenrij met aantal per status (gelijke breedte, geen scroll) en statuswissel via `Select` op elke kaart.

## Lege staat

Gestippelde rand, titel in `font-display` 16–17px, één zin uitleg in `text-muted-foreground`, één primaire knop. Geen illustraties.

## Navigatie

**Desktop** — `Sidebar` van 248px: logo-blok, sectielabel, items van 40px met `rounded-md`; actief item `bg-sidebar-accent text-sidebar-accent-foreground font-semibold`; teller rechts in het item. Voetblok met avatar, naam en rol.

**Mobiel** — bovenbalk met terug-/menuknop (40px) en titel; onderaan een tabbalk met `pb-[env(safe-area-inset-bottom)]`. Admin vijf bestemmingen (Start, Projecten, Taken, Tickets, Agenda), klantportaal vier (Projecten, Tickets, Agenda, Documenten). Actief item in `text-primary`; badge rechtsboven het icoon.

**Kruimelpad** — `Breadcrumb`, laatste niveau `text-foreground font-semibold`, scheidingsteken `/` in `text-neutral-300`.

## Gegevenslijst en lijstrij

Label links in `text-muted-foreground`, waarde rechts uitgelijnd; bedragen en datums in `font-mono`. Rijen gescheiden met `border-border-subtle`.

Lijstrij agenda: datumblokje (maand + dag) links met scheidingslijn, titel plus tijd/type rechts. Lijstrij document: type-tegel (PDF/FIG/ZIP/DOC), naam, grootte en datum, actie rechts.

## Iconografie

`lucide-react`, 16px in navigatie en knoppen, 20px in kopbalken, `stroke-width: 1.75`. In de ontwerpen staan tijdelijke tekstglyphs op de plek van deze iconen.
