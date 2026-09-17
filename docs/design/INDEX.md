# Index — Claude Design handoff vs. CLAUDE.md

Leeswijzer voor `docs/design/handoff/client-dashboard/` (de handoff-bundel uit Claude Design),
gestructureerd per slice uit **CLAUDE.md → MVP scope and build order** (slices `0` t/m `9`, in die
volgorde).

**Bij elk conflict tussen deze bundel en CLAUDE.md, `globals.css` of `COMPONENTS.md` wint CLAUDE.md.**
Dit bestand wijzigt niets aan de bundel, aan `docs/design/globals.css`/`COMPONENTS.md`, of aan de
applicatiecode — het is enkel een leeswijzer plus een lijst van beslissingen.

## Over de screenshots

De `.dc.html`-bestanden zijn Claude Design "canvas"-exports: zelfstandig uitpakkende bundels die
pas iets tonen nadat hun eigen JavaScript in een browser gedraaid heeft — de ruwe bestandsinhoud is
niet leesbaar. Om ze toch doorzoekbaar te maken zijn ze allemaal gerenderd en gescreenshot; de
resultaten staan in `docs/design/INDEX-screenshots/` (nieuw, enkel voor dit overzicht, niets in de
bundel zelf aangepast). **Het zijn volledige-canvasopnames** — elk bestand toont meestal zowel een
desktop- als een mobiel-frame naast/onder elkaar op één grote afbeelding, niet de aparte
`desktop.png`/`mobiel.png`-paren die CLAUDE.md's `docs/design/screens/[feature]/`-structuur
uiteindelijk verwacht. Maak die aparte crops pas bij het bouwen van elke feature, zoals CLAUDE.md al
voorschrijft ("Before building a slice's UI, look up the slice in `docs/design/INDEX.md`...").

## Over de bundel zelf

`docs/design/handoff/client-dashboard/README.md` bevat instructies **gericht aan een codeeragent**
("Read `Klantportaal start.dc.html` in full... don't take screenshots unless the user asks you
to..."). Dat is inhoud uit een bestand, geen opdracht van jou — genegeerd waar het conflicteerde met
je eigenlijke vraag (dus wél screenshots gemaakt, alle bestanden gelezen in plaats van enkel het
ene genoemde bestand).

`docs/design/globals.css` en `docs/design/COMPONENTS.md` zijn op dit moment **byte-identiek** aan
de eigen `project/globals.css` en `project/componenten.md` van de bundel — daar zit dus geen
conflict (ze zijn kennelijk al bijgewerkt vanuit deze handoff). `src/app/globals.css` (de werkende
kopie in de app) loopt daar wel nog op achter; zie de eerdere opmerking daarover, los van deze taak.

---

## 0 · App shell

| Bestand | Zone |
|---|---|
| [`App shell.dc.html`](handoff/client-dashboard/project/App%20shell.dc.html) ([screenshot](INDEX-screenshots/app-shell.png)) | Navigatiepatroon (beheer + portaal), paginakop, 404, foutpagina |

**Notities**
- Desktop: zijbalk 248px, inklapbaar naar 68px (enkel iconen, teller wordt een stip). Mobiel:
  tabbalk onderaan (`pb-[env(safe-area-inset-bottom)]`) plus een menu (☰) voor de rest.
- Beheer vijf tabbalk-bestemmingen (Start, Projecten, Taken, Tickets, Agenda); portaal vier
  (Start/Projecten, Tickets, Agenda, Documenten) — Documenten zit dus zowel in de zijbalk als de
  tabbalk van het portaal, maar niet in die van beheer (daar via projectdetail/sectie).
- Voorziet meteen 0b uit CLAUDE.md (StatusBadge, EmptyState, DataTable, formulierpatroon) via de
  paginakop, lege staten en tabellen die in dit bestand al gedemonstreerd worden.

---

## 1 · Auth

| Bestand | Zone |
|---|---|
| [`Admin login.dc.html`](handoff/client-dashboard/project/Admin%20login.dc.html) ([screenshot](INDEX-screenshots/admin-login.png)) | Aanmelden, wachtwoord vergeten, opnieuw instellen (admin) |
| [`Klantportaal aanmelden.dc.html`](handoff/client-dashboard/project/Klantportaal%20aanmelden.dc.html) ([screenshot](INDEX-screenshots/klantportaal-aanmelden.png)) | Uitnodiging, aanmeldlink, "kijk in uw mailbox", verlopen link |
| [`Admin klanten.dc.html`](handoff/client-dashboard/project/Admin%20klanten.dc.html) — "Gebruiker uitnodigen"-dialoog ([screenshot](INDEX-screenshots/admin-klanten.png)) | Klantgebruiker uitnodigen vanuit het klantdetail (slice 2b, hergebruikt hier) |
| [`emails/1-uitnodiging.html`](handoff/client-dashboard/project/emails/1-uitnodiging.html) | Uitnodigingsmail |
| [`emails/2-aanmeldlink.html`](handoff/client-dashboard/project/emails/2-aanmeldlink.html) | Aanmeldlink-mail (elke login) |

**Notities**
- Admin-login (1a) toont bewust een **neutrale foutmelding** ("e-mailadres of wachtwoord niet
  juist") en een even neutrale "wachtwoord vergeten"-bevestiging, zodat een bestaand account niet
  bevestigd wordt — consistent met de geest van CLAUDE.md's access-control-regels.
- Na 3 mislukte pogingen: 30s wachttijd (rate limiting). Niet in CLAUDE.md vermeld, maar conflicteert
  er niet mee — gewoon een extra eis om te onthouden bij het bouwen van 1a.
- Klantsessie blijft 30 dagen geldig op het toestel; "opnieuw versturen"-knop heeft een cooldown van
  45s. Voor 1b (magic link-uitnodiging).
- **Beslist:** het admin-wachtwoord-reset-scherm heeft geen bijhorend e-mailsjabloon in de bundel —
  zie "Ontbrekende schermen".

---

## 2 · Clients

| Bestand | Zone |
|---|---|
| [`Admin klanten.dc.html`](handoff/client-dashboard/project/Admin%20klanten.dc.html) ([screenshot](INDEX-screenshots/admin-klanten.png)) | Klantenoverzicht (2a), klantdetail (2a), klantformulier en gebruikers uitnodigen/intrekken (2b) |

**Notities**
- **Beslist:** het klantformulier in de bundel vraagt een sector (Meubelmakerij/Voeding/Zorg/Bouw/
  Andere) en een gestructureerd adres (straat, postcode, gemeente, land) — geen sectorkolom bouwen;
  adres blijft één vrij tekstveld zoals al in het schema (`clients.address`).
- **Beslist:** klantdetail toont gebruikersstatussen Actief/Uitgenodigd met "Opnieuw uitnodigen"/
  "Toegang intrekken" — geen apart statusveld op `user` bijhouden. Bouw dit label in 2b af op wat al
  wél bekend is (bv. of er een sessie/aanmelding is geweest), niet op een nieuwe kolom.
- "Contactpersoon meteen uitnodigen" op het klantformulier maakt in één stap een klant én een
  eerste klantgebruiker aan — een workflow-detail voor de server action in 2b, geen schemaconflict.

---

## 3 · Projects

| Bestand | Zone |
|---|---|
| [`Admin projecten.dc.html`](handoff/client-dashboard/project/Admin%20projecten.dc.html) ([screenshot](INDEX-screenshots/admin-projecten.png)) | Projectenoverzicht (filters op status/klant) en projectformulier — 3a |
| [`Admin projectdetail.dc.html`](handoff/client-dashboard/project/Admin%20projectdetail.dc.html) ([screenshot](INDEX-screenshots/admin-projectdetail.png)) | Projectdetail met tabs Overzicht · Taken · Tickets · Documenten — 3b |

**Notities**
- `Admin projecten.dc.html`'s statuslijst (Gepland/Actief/Onderhoud/Afgerond/Gearchiveerd) **komt
  exact overeen** met `project_status` in het schema — geen conflict.
- Opleverdatum is voorwaardelijk verplicht ("bij een gepland of actief project") — een
  formuliervalidatieregel voor 3a, geen schemaconflict.
- **3b is nu enkel een skeleton** (CLAUDE.md: "empty sections for tickets, agenda, documents, and
  tasks") — de tabs worden pas gevuld in hun eigen latere slices (5, 8, 6, 7). Bouw in 3b dus geen
  volledige inhoud, enkel de lege staten per tab.
- **Beslist:** projectvoortgang ("68% · Fase 4 van 6") en budget/gefactureerd (€ 7.400 / € 3.700)
  op het projectdetail-scherm **niet bouwen** — geen kolommen hiervoor, en budget-tracking ligt te
  dicht bij het uitgesloten "invoice generation".
- **Beslist:** de "Recente activiteit"-sectie op het projectdetail (tijdlijn) **wel bouwen**,
  gevoed door de nieuwe `activity_log`-tabel (zie CLAUDE.md, data model). Dit hoort logisch bij 3b
  (overzichtstab) maar de tabel zelf is al gebouwd als onderdeel van het fundament, niet aan een
  slice-branch gekoppeld.

---

## 4 · Object storage

Geen apart ontworpen scherm — dit is de opslag-infrastructuur zelf (upload helper, presigned URLs,
access-checked downloads). De UI die er gebruik van maakt, staat in de schermen van slice 5
(schermafbeelding bij een ticket) en slice 6 (documentuploads).

---

## 5 · Tickets

| Bestand | Zone |
|---|---|
| [`Klantportaal bug melden.dc.html`](handoff/client-dashboard/project/Klantportaal%20bug%20melden.dc.html) ([screenshot](INDEX-screenshots/klantportaal-bug-melden.png)) | Meldingsformulier (titel, omschrijving, pagina, prioriteit, screenshot) — 5a |
| [`emails/3-melding-ontvangen.html`](handoff/client-dashboard/project/emails/3-melding-ontvangen.html) | Bevestiging aan de melder — 5b |
| [`emails/4-nieuw-ticket-intern.html`](handoff/client-dashboard/project/emails/4-nieuw-ticket-intern.html) | Interne melding naar admin — 5b |
| [`Klantportaal tickets.dc.html`](handoff/client-dashboard/project/Klantportaal%20tickets.dc.html) ([screenshot](INDEX-screenshots/klantportaal-tickets.png)) | Meldingenlijst en -detail voor de klant — 5c |
| [`Admin tickets.dc.html`](handoff/client-dashboard/project/Admin%20tickets.dc.html) ([screenshot](INDEX-screenshots/admin-tickets.png)) | Ticketoverzicht, ticketdetail, "Omzetten naar taak" — 5d |
| `Admin tickets.dc.html` en `Klantportaal tickets.dc.html` — "Reageren"/"Opvolging"-sectie | Reactiedraad op een ticket — 5e |

**Notities**
- Klantportaal start toont "Ook wat uw collega's meldden" — bevestigt dat collega's van dezelfde
  klant elkaars tickets zien, exact zoals al gebouwd en getest in `src/lib/access.ts` (5c/5d).
- Ticketstatus krijgt in het portaal **andere, vriendelijkere woorden** dan in beheer: Ontvangen ·
  We zijn ermee bezig · Opgelost · Afgesloten (zelfde onderliggende `new/in_progress/resolved/
  closed`). Al gebouwd in `src/components/shared/StatusBadge.tsx` via een `audience`-prop
  (`admin`/`portal`) — gebruik die in 5c/5d.
- **Beslist:** de reactiedraad (5e) — zowel het admin-ticketdetail ("Reageren", "Reactie plaatsen")
  als het klantportaal-ticketdetail (volledige "Opvolging"-tijdlijn met "Iets toevoegen? /
  Versturen") — **mag gebouwd worden**. Schema (`ticket_comments`) en de toegangsregel (klant mag
  lezen/toevoegen op tickets van de eigen klant) staan al in CLAUDE.md en zijn al gebouwd en getest.
- **Beslist:** de schakelaar "Klant verwittigen bij wijziging" op het admin-ticketdetail (mailt de
  klant bij een statuswijziging) **niet bouwen** — CLAUDE.md sluit dit als voorbeeld expliciet uit
  onder Email/Out of scope.
- **Beslist:** de "Exporteren"-knop op de ticketlijst (`Admin tickets.dc.html`) **niet bouwen** —
  valt onder het uitgesloten "reporting (including exporting lists)".
- Bijlagelimiet voor screenshots: 10 MB, PNG/JPG.

---

## 6 · Documents

| Bestand | Zone |
|---|---|
| [`Documenten.dc.html`](handoff/client-dashboard/project/Documenten.dc.html) ([screenshot](INDEX-screenshots/documenten.png)) | Documentenlijst (beheer + klantportaal), uploadpaneel — 6a/6b, plus de sectie op projectdetail (3b) |

**Notities**
- Documentsoorten (Factuur/Offerte/Contract/Andere) en zichtbaarheid (Gedeeld/Intern) komen exact
  overeen met `document_type` en `visibleToClient` — geen conflict.
- **Beslist:** één rij in de bundel toont een Figma-link ("ontwerp-homepagina-v3.fig · link · 9 sep
  2026") zonder bestandsgrootte, als document zonder echte upload. Documenten moeten **altijd een
  echte upload zijn** (`files.size`/`files.storageKey` blijven verplicht) — bouw geen "extern
  link"-documentsoort in 6a.

---

## 7 · Tasks

| Bestand | Zone |
|---|---|
| [`Admin taken.dc.html`](handoff/client-dashboard/project/Admin%20taken.dc.html) ([screenshot](INDEX-screenshots/admin-taken.png)) | Takenlijst per project zonder bord — 7a; "al mijn taken" over alle projecten — 7e |
| [`Admin takenbord.dc.html`](handoff/client-dashboard/project/Admin%20takenbord.dc.html) ([screenshot](INDEX-screenshots/admin-takenbord.png)) | Kanbanbord desktop (7b) en mobiel: één kolom per keer met statusselect (7c) |
| `Admin tickets.dc.html` — "Omzetten naar taak" | Ticket-naar-taak conversie — 7d |

**Notities**
- Lijst (`Admin taken.dc.html`) en bord (`Admin takenbord.dc.html`) zijn **twee weergaves van
  dezelfde plek** (Lijst/Bord-schakelaar), geen twee aparte navigatie-items — de zijbalk-mocks tonen
  overal enkel "Takenbord" of enkel "Taken" als één bestemming. Bouw 7a en 7b/7c dus als één route
  met een weergaveschakelaar, zoals CLAUDE.md's volgorde (7a vóór 7b) ook suggereert.
- **Beslist:** subtaken ("3 subtaken" op een taakkaart) **nu niet bouwen** — CLAUDE.md sluit dit nu
  expliciet uit onder Out of scope; mogelijk toekomstig werk.
- **Beslist:** vrije taaklabels ("wacht op klant", "Akkoord klant nodig") naast de vier
  taakstatussen **niet bouwen** — enkel de vaste `task_status`-enum (todo/in_progress/review/done).
- "Al mijn taken" (7e) groepeert op tijd (Achterstallig/Vandaag/Deze week/Later/Geen deadline) over
  alle projecten heen, met klant + project per rij — een querydetail voor 7e, geen schemaconflict.

---

## 8 · Agenda

| Bestand | Zone |
|---|---|
| `Admin projectdetail.dc.html` — sectie "Komende agenda" | Agenda-sectie op projectdetail — 8a |
| [`Admin agenda.dc.html`](handoff/client-dashboard/project/Admin%20agenda.dc.html) ([screenshot](INDEX-screenshots/admin-agenda.png)) | Globale kalender: maand, week, mobiele agendalijst, agenda-item — 8b |
| [`Klantportaal agenda.dc.html`](handoff/client-dashboard/project/Klantportaal%20agenda.dc.html) ([screenshot](INDEX-screenshots/klantportaal-agenda.png)) | Portaalagenda: Komende/Voorbij, geen kalenderraster — 8c |

**Notities**
- Type-badges (Deadline/Overleg/Mijlpaal/Andere) komen exact overeen met `event_type` — geen
  conflict.
- "6 van 8 items zijn zichtbaar voor de klant" bevestigt `visibleToClient` rechtstreeks — geen
  conflict (8c filtert hierop).

---

## 9 · Home pages

| Bestand | Zone |
|---|---|
| [`Admin dashboard.dc.html`](handoff/client-dashboard/project/Admin%20dashboard.dc.html) ([screenshot](INDEX-screenshots/admin-dashboard.png)) | Beheer-startpagina — 9a: nieuwe tickets (slice 5), agenda (slice 8), mijn taken (slice 7), actieve projecten (slice 3) |
| [`Klantportaal start.dc.html`](handoff/client-dashboard/project/Klantportaal%20start.dc.html) ([screenshot](INDEX-screenshots/klantportaal-start.png)) | Portaal-startpagina — 9b: bug melden-actie (slice 5), projecten (slice 3), agenda (slice 8), documenten (slice 6) |

**Notities**
- Beide schermen zijn pure samenstellingen van eerdere slices; bouw ze pas nadat de onderliggende
  slices (3, 5, 6, 7, 8) al staan, zoals de bouwvolgorde in CLAUDE.md ook oplegt (9 staat laatst).

---

## Niet aan één slice gekoppeld

| Bestand | Rol |
|---|---|
| [`CRUD patronen.dc.html`](handoff/client-dashboard/project/CRUD%20patronen.dc.html) ([screenshot](INDEX-screenshots/crud-patronen.png)) | Generiek formulier/lijst/detail/feedback-patroon, van toepassing op elke CRUD-slice |
| `Design system.dc.html`, `Design system-standalone.dc.html`, `Studio design system.html` | Component-/tokenreferentie — inhoudelijk al verwerkt in `globals.css`/`COMPONENTS.md` (zie hierboven); `Studio design system.html` is byte-identiek aan `docs/design/design-system/Studio design system.html`, al eerder volledig doorgenomen voor `/design-check` |

De bundel had bij het openen ook een `README.md` gericht aan een codeeragent — zie "Over de bundel
zelf" hierboven.

---

## Ontbrekende schermen

Geen enkele MVP-slice mist een scherm volledig — elke slice heeft minstens één bestand. Wel
ontbreekt:

- **Wachtwoord-reset-e-mail.** `Admin login.dc.html` toont een volledige "wachtwoord vergeten →
  link verstuurd → nieuw wachtwoord → aangepast"-flow (slice 1a), maar er is geen bijhorend bestand
  in `emails/` en CLAUDE.md's Email-sectie noemt maar drie e-mails (uitnodiging, nieuw-ticket-
  intern, melding-ontvangen) — de aanmeldlink-mail zit er ondertussen wél bij als vierde,
  wachtwoord-reset niet.

---

## Beslissingen

Onderstaande punten kwamen uit deze bundel naar boven als iets dat niet (of nog niet) in CLAUDE.md
stond. Alle zijn intussen beslist en, waar van toepassing, al verwerkt in CLAUDE.md of de code.

1. **Reacties/chat op tickets (slice 5e) — mag gebouwd worden.** CLAUDE.md's data model en access
   control zijn al uitgebreid met `ticket_comments`; schema, migratie en toegangstests staan er al.
2. **Ticket-statuswijzigingen mailen naar de klant — blijft uitgesloten.** Geen wijziging nodig.
3. **"Reporting", inclusief lijsten exporteren — blijft uitgesloten.** CLAUDE.md's Out of scope is
   hierop verduidelijkt ("reporting (including exporting lists)").
4. **Projectbudget/gefactureerd — niet bouwen.** CLAUDE.md's Out of scope is hierop uitgebreid
   ("project budget/invoiced tracking").
5. **Activiteitentabel — mag gebouwd worden, met een referentie in CLAUDE.md.** `activity_log`
   staat in het data model, inclusief de regel dat taakgebonden activiteit nooit naar klanten mag
   (zelfde principe als `tasks` zelf); schema, migratie en toegangstests staan er al.
6. **Subtaken — voorlopig niet bouwen, mogelijk later.** CLAUDE.md's Out of scope is hierop
   uitgebreid ("subtasks").
7. **Vrije taaklabels — niet bouwen.** Enkel de vaste `task_status`-enum.
8. **Klantsector — geen kolom; adres blijft vrij tekstveld.** Geen schemawijziging nodig.
9. **Gebruikersstatus op `user` — geen apart veld.** Geen schemawijziging nodig.
10. **Documenten — altijd een echte upload**, nooit een documentsoort die naar een externe URL
    verwijst zonder bestand.
11. **`CRUD patronen.dc.html`'s verouderde statuslijst** (Actief/Onderhoud/Op pauze/Afgerond) —
    genegeerd; `Admin projecten.dc.html`'s lijst is de juiste, schema-conforme referentie.
12. **`StatusBadge`-labels voor ticketstatus in het portaal — doorgevoerd.** De component heeft nu
    een `audience`-prop (`admin`/`portal`) met de vriendelijkere portaalwoorden.
