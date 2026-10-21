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
