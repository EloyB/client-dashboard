# ROADMAP — Project Dashboard

Ideeën voor na de MVP. Dit bestand is een referentie, geen opdracht: niets hieruit bouwen zonder expliciete beslissing.

---

## 1. Agenda-sync naar iPhone

**Doel:** agenda-items uit het dashboard verschijnen automatisch in de agenda op mijn iPhone.

**Haalbaarheid:** hoog.

**Aanpak**

- **Fase A — ICS-feed (start hiermee):** privé-URL met geheime token, bv. `/calendar/feed/[token].ics`. Abonneren via iPhone → Agenda → Voeg abonnement toe. Eenrichtingsverkeer, weinig werk.
- **Fase B — Google Calendar API (enkel indien nodig):** events rechtstreeks wegschrijven naar een Google-agenda die op de iPhone gesynchroniseerd is. Bijna realtime.

**Aandachtspunten**

- ICS: iOS bepaalt zelf het verversingsinterval, nieuwe items kunnen met vertraging verschijnen.
- ICS-token moet te vernieuwen zijn als de URL uitlekt.
- Google API: OAuth nodig, en een mapping bijhouden tussen dashboard-event en Google-event (bv. `externalCalendarId` op `events`).
- Tijdzone `Europe/Brussels` correct meegeven, ook voor all-day events.
- CalDAV rechtstreeks naar iCloud vermijden: omslachtig en fragiel.

---

## 2. PWA voor iPhone

**Doel:** het dashboard installeren op het beginscherm en gebruiken als native app.

**Haalbaarheid:** hoog. Mobile-first uit de MVP is de belangrijkste voorbereiding.

**Aanpak**

- Web app manifest via Next.js (`app/manifest.ts`), app-iconen en splash screens.
- `display: standalone`, theme color, correcte viewport en safe areas (notch, home indicator).
- Service worker voor caching van de app-shell en een nette offline-pagina.
- Optioneel: web push notificaties (iOS 16.4+, enkel voor geïnstalleerde PWA's), bv. bij een nieuw ticket.

**Aandachtspunten**

- **Login:** magic links openen in Safari, niet in de geïnstalleerde PWA, en die delen geen sessie. Admin-login daarom via wachtwoord of passkey. Magic links enkel voor klantuitnodigingen.
- Geen achtergrondsynchronisatie op iOS.
- Geen "delen naar app" vanuit andere iOS-apps.
- Push vraagt toestemming van de gebruiker en werkt pas na installatie op het beginscherm.

---

## 3. AI-agent voor tickets

**Doel:** binnenkomende tickets laten analyseren door een AI-agent die de code bekijkt, een fix voorstelt of maakt, en een pull request opent.

**Haalbaarheid:** technisch haalbaar, maar het hoogste risico van de drie.

**Aanpak**

- Veld `githubRepo` toevoegen aan `projects`.
- Knop "Laat AI analyseren" op een ticket in de admin (geen automatische trigger).
- Dashboard start een GitHub Actions-workflow in de repo van het project (Claude Code GitHub Action of Claude Agent SDK).
- Agent analyseert, maakt een branch en opent een PR.
- PR-link en status worden teruggekoppeld aan het ticket (webhook of polling).
- Stap 1 kan ook enkel "analyse + voorstel als commentaar" zijn, zonder code te wijzigen.

**Aandachtspunten**

- **Prompt injection:** tickettekst komt van klanten en is onbetrouwbare input. Nooit blind uitvoeren.
- Altijd een menselijke review: nooit automatisch mergen.
- Workflow met minimale rechten: geen productie-secrets, geen deploy-rechten, enkel branch + PR.
- Klantmeldingen zijn vaak vaag. Realistische verwachting: analyse en voorstel, niet altijd een werkende fix.
- API-kosten per run opvolgen; eventueel een limiet per maand.
- Klanten zien niets van de AI-analyse of de PR in het portaal.

---

## Geparkeerd uit de MVP

- E-mail bij statuswijziging van een ticket naar de klant
- Reacties/chat op tickets
- Tijdregistratie per project
- Assignees op taken
- Koppeling met boekhoudtool voor offertes/facturen
- Realtime updates
- Rapportage en projectstatistieken
- Multi-tenancy voor andere freelancers
