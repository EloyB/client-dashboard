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
