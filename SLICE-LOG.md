# Slice-log

Kort logboek voor de autonome doorloop van de resterende MVP-slices (zie SLICE-PROMPTS.md). Per slice: branch, PR, migraties, aannames, openstaande twijfels.

---

## Slice 6a — Documenten uploaden (admin)

- **Branch:** `slice/6a-documents-admin` (vertrekt van `slice-5d-admin-tickets`)
- **PR:** [#2](https://github.com/EloyB/client-dashboard/pull/2) → base `slice-5d-admin-tickets`
- **Migraties:** geen (schema `documents`/`files` bestond al)
- **Aannames:**
  - `features/documents/queries.ts` (generiek, pre-5d) niet retroactief opgesplitst in admin/portaal — zelfde precedent als `listTicketsForProject` uit 5d.
  - Upload-sheet blijft open en reset zichzelf na opslaan, voor vlot na-elkaar uploaden.
  - Orphaned `files`-rij bij een mislukte `createDocument` na geslaagde upload: zelfde aanvaarde risico als elders, geen extra cleanup.
  - "Alleen gedeeld met de klant"-switch op de volledige lijst filtert client-side, niet via de URL (DataTable's filters-prop ondersteunt geen boolean-switch) — hoeft niet over een herlaad te overleven, in tegenstelling tot de status/prioriteit-pills.
- **Gevonden en gefixt tijdens het testen (niet in het oorspronkelijke plan):**
  - Bug: de telling "X bestanden · Y gedeeld" op de projectdetail-sectie toonde de lengte van de al-beperkte (max 4) rijenlijst in plaats van het echte totaal. Gefixt door de volledige lijst op te halen voor de telling en pas daarna te knippen voor weergave.
  - Bug: op 375px overschreden de knoppen "Alle documenten" + "Uploaden" de kaartbreedte in de projectdetail-sectie. Gefixt door ze op mobiel te stapelen.
- **Openstaande twijfels:** geen.

---

## Slice 6b — Documenten in het portaal

- **Branch:** `slice/6b-documents-portal` (vertrekt van `slice/6a-documents-admin`)
- **PR:** [#3](https://github.com/EloyB/client-dashboard/pull/3) → base `slice/6a-documents-admin`
- **Migraties:** geen
- **Aannames:**
  - Geen portaal-documentdetailpagina/route — downloaden gaat rechtstreeks via het bestaande `getFileDownloadUrl` (met eigen access-check), geen `getDocumentById` nodig.
  - Groepering per project via een eigen component (geen `DataTable`, die ondersteunt geen groepering).
  - `OpenDocumentButton`/`fileTypeTile` uit 6a verplaatst naar `components/shared/` (tweede occurrence-regel uit CLAUDE.md) en hernoemd naar `DocumentDownloadButton`/`fileTypeTile`, met een `label`-prop voor het verschil "Openen" (admin) vs. "Downloaden" (portaal). Geen gedragswijziging voor 6a.
- **Gevonden en gefixt tijdens het testen (niet in het oorspronkelijke plan):**
  - Bug: de documentsoort-badge was per ongeluk verborgen op mobiel (`hidden sm:flex`), terwijl het ontwerp die op beide breedtes toont. Gefixt.
  - Bug (in de Playwright-testhelper zelf, niet in productiecode): `.count()` om tussen twee knoppen te kiezen race't met de DOM en liet de test soms vasthangen. Vervangen door `.or()`.
  - Opruiming: een paar achtergebleven "Zzz Temp Client"-rijen in de lokale ontwikkel-database van eerder gecrashte testruns (cleanup() liep niet door een test-timeout) zijn verwijderd.
- **Openstaande twijfels:** geen.

---

## Slice 7a — Takenlijst per project

- **Branch:** `slice/7a-tasks-list` (vertrekt van `slice/6b-documents-portal`)
- **PR:** [#4](https://github.com/EloyB/client-dashboard/pull/4) → base `slice/6b-documents-portal`
- **Migraties:** geen (`tasks`, inclusief `position`, bestond al)
- **Aannames:**
  - Geen `queries.portal.ts`-tegenhanger — taken zijn volledig intern, geen enkele portaalroute of -query raakt ze aan.
  - Position altijd via `generateKeyBetween` ná de laatste taak in dezelfde (project, status)-kolom, zodat 7b (kanban) er zonder migratie op kan voortbouwen.
  - Geen expliciete lege-staat-screenshot in de designs gevonden voor taken; `EmptyState variant="invite"` toegepast, consistent met documenten/tickets.
- **Gevonden tijdens het testen:** geen bugs — screenshots op desktop en 375px kwamen overeen met het verwachte patroon zonder aanpassingen nodig.
- **Openstaande twijfels:** geen.

---

## Slice 7b — Kanbanbord (desktop)

- **Branch:** `slice/7b-kanban-desktop` (vertrekt van `slice/7a-tasks-list`)
- **PR:** [#5](https://github.com/EloyB/client-dashboard/pull/5) → base `slice/7a-tasks-list`
- **Migraties:** geen (`tasks.position` bestond al sinds 7a)
- **Dependency toegevoegd:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — al vermeld in CLAUDE.md's stack ("Drag & drop: dnd-kit"), dus geen aparte goedkeuring nodig, enkel de installatie zelf ontbrak nog.
- **Aannames:**
  - Bord/lijst zijn één route met `?view=` (standaard `list`, `board` opt-in) — conform INDEX.md's expliciete notitie dat dit geen twee navigatie-items zijn.
  - "Alle prioriteiten"/"Alleen vervallen"-filters op het bord zijn client-side, niet URL-persistent (enkel de bord/lijst-keuze zelf moet dat zijn volgens de prompt).
  - Taakreferenties (`TSK-XXXXXXXX`) ontbraken in 7a's lijst maar stonden wel in de designscreenshots van zowel lijst als bord — met terugwerkende kracht toegevoegd aan `TasksTable` (7a) binnen deze branch, aangezien beide weergaven dezelfde kolommen moeten tonen.
- **Gevonden en gefixt tijdens het testen (niet in het oorspronkelijke plan):**
  - Bug: `onDragEnd` herkende een kruis-kolom-verplaatsing niet meer als zodanig omdat `onDragOver` de kolomstatus al live had bijgewerkt — de kaart verplaatste zich visueel maar er gebeurde geen server-call. Gefixt door bij `onDragEnd` te vergelijken met de snapshot van vóór het slepen in plaats van de al-gemuteerde staat.
- **Openstaande twijfels:** geen.

---

## Slice 7c — Kanban op mobiel

- **Branch:** `slice/7c-kanban-mobile` (vertrekt van `slice/7b-kanban-desktop`)
- **PR:** [#6](https://github.com/EloyB/client-dashboard/pull/6) → base `slice/7b-kanban-desktop`
- **Migraties:** geen
- **Scope aangepast tijdens review:** het mobiele kanbanbord zelf (`MobileKanbanBoard`, kolomwisselaar) is tijdens de PR-review geschrapt — op mobiel volstaat enkel de lijstweergave, net als vóór deze slice. De bord/lijst-toggle blijft dus desktop-only (`isDesktop &&`), `view` valt op mobiel altijd terug op `list`, ongeacht `?view=`. `MobileKanbanBoard.tsx` en `e2e/admin-kanban-mobile.spec.ts` zijn verwijderd.
- **Wat wél overblijft uit deze slice:** de opruiming die ook het desktopbord en de lijst ten goede komt — `isOverdue()` (stond drievoudig gekopieerd) samengevoegd in `taskHelpers.ts`; een nieuwe `Pill`-component vervangt dubbele pill-markup in het desktopbord se "Alleen vervallen"; `TaskMobileCard`/`TaskRowActions` geëxtraheerd naar een eigen bestand zodat de lijst se mobiele kaart (375px) herbruikbaar is.
- **Openstaande twijfels:** geen.
