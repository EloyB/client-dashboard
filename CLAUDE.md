# CLAUDE.md — Project Dashboard

Personal web app for Studio Swyft to manage client projects: tasks, bug reports, agenda, and documents. One admin (the owner) and client users who access a limited portal.

## Stack

- **Framework:** Next.js (App Router, latest stable), TypeScript strict mode
- **Styling/UI:** Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL (Scaleway Managed Database in production, Docker locally)
- **ORM:** Drizzle ORM + drizzle-kit
- **Auth:** Better Auth (admin: email + password; client users: magic link invites)
- **Validation:** Zod
- **File storage:** Scaleway Object Storage (S3-compatible, via `@aws-sdk/client-s3`)
- **Email:** transactional provider for client invites and admin notifications on new tickets
- **Drag & drop:** dnd-kit, ordering with `fractional-indexing`
- **Testing:** Vitest (unit/integration), Playwright (e2e)
- **Package manager:** pnpm

Do not introduce new dependencies without asking first.

## Project structure

```
docs/
  design/              Claude Design output (read-only reference): globals.css, COMPONENTS.md, INDEX.md, handoff/
src/
  app/
    (auth)/            login, invite acceptance
    (admin)/app/       admin area: projects, kanban, calendar, clients
    (portal)/portal/   client area: projects, tickets, events, documents
    api/               only for things server actions cannot do (e.g. auth handler, uploads)
  components/
    ui/                shadcn/ui primitives, do not add business logic here
    shared/            reusable app components (DataTable, EmptyState, StatusBadge, FileUpload, ...)
    [feature]/         feature-specific components (tasks/, tickets/, events/, ...)
  features/
    [feature]/
      actions.ts       server actions
      queries.ts       read queries
      schemas.ts       Zod schemas
      types.ts
  db/
    schema/            one file per table
    index.ts           db client
    migrations/
  lib/
    auth.ts
    access.ts          authorization helpers (see Access control)
    storage.ts
    utils.ts
```

## Data model

```
users              (Better Auth table, extended)
  id, name, email, role: 'admin' | 'client', clientId → clients (null for admin)

clients
  id, name, vatNumber, email, phone, address, notes, createdAt, updatedAt

projects
  id, clientId → clients, name, description, websiteUrl,
  status: 'planned' | 'active' | 'maintenance' | 'completed' | 'archived',
  startDate, dueDate, createdAt, updatedAt

tasks              (admin only, never exposed to clients)
  id, projectId → projects, title, description,
  status: 'todo' | 'in_progress' | 'review' | 'done',
  priority: 'low' | 'medium' | 'high', position (fractional index), dueDate,
  ticketId → tickets (nullable), completedAt, createdAt, updatedAt

tickets            (bug reports)
  id, projectId → projects, reportedById → users, title, description, pageUrl,
  status: 'new' | 'in_progress' | 'resolved' | 'closed',
  priority: 'low' | 'medium' | 'high', resolvedAt, createdAt, updatedAt

events             (agenda)
  id, projectId → projects, title, description,
  type: 'deadline' | 'meeting' | 'milestone' | 'other',
  startsAt, endsAt, allDay, location, visibleToClient (default true), createdAt, updatedAt

files
  id, storageKey, filename, mimeType, size, uploadedById → users, createdAt

documents
  id, projectId → projects, fileId → files, title,
  type: 'invoice' | 'quote' | 'contract' | 'other', visibleToClient (default true), createdAt

ticket_attachments
  ticketId → tickets, fileId → files
```

Conventions: UUID primary keys, `createdAt`/`updatedAt` timestamps with timezone, Postgres enums for status fields, foreign keys with explicit `onDelete` behaviour.

## Access control — critical

Security is more important than speed. A client must never see data from another client.

- Every server action and query starts by resolving the session via helpers in `src/lib/access.ts`.
- `requireAdmin()` for all admin routes and actions.
- `requireClientUser()` returns the user with `clientId`; all portal queries **must** filter on that `clientId` through the project relation.
- `assertProjectAccess(user, projectId)` before any read or write on project-related data.
- Clients never access `tasks`, nor events/documents with `visibleToClient = false`.
- Never trust IDs from the client; always verify ownership server-side.
- File downloads use short-lived presigned URLs, generated only after an access check.
- Route protection in layouts/middleware is a convenience, not the security boundary. Checks happen in actions and queries.
- Every new feature that exposes data to clients gets a test proving another client cannot access it.

## Database workflow

- Change schema in `src/db/schema/`, then `pnpm drizzle-kit generate`, review the SQL, then `pnpm drizzle-kit migrate`.
- **Never** use `drizzle-kit push`.
- **Never** run migrations or destructive queries against production. Only work against the local Docker database.
- Seed script in `src/db/seed.ts` with realistic test data: one admin, two clients with multiple users each.

## Clean code

- Code must be self-explanatory: descriptive names for variables, functions, and components. Avoid abbreviations.
- **Minimal inline comments.** If code needs a comment to be understood, rename or refactor instead. Comments are only allowed to explain _why_ something non-obvious is done (e.g. a workaround), never _what_ the code does.
- No commented-out code, no leftover `console.log`.
- Small, single-purpose functions. Prefer early returns over nested conditionals.
- No `any`. No non-null assertions (`!`) unless unavoidable.
- No magic strings or numbers; use constants or enums shared with the database schema.
- Keep business logic out of components: components render, `features/*` handles data and rules.
- Follow existing patterns in the codebase before inventing new ones.

## Code formatting

- **Prettier** is the single source of truth for formatting. Never format code manually against the Prettier output.
- Config in `.prettierrc` at the project root:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
    "printWidth": 100,
    "tabWidth": 2,
    "plugins": ["prettier-plugin-tailwindcss"]
  }
  ```
- `prettier-plugin-tailwindcss` sorts Tailwind classes automatically; do not reorder classes by hand.
- ESLint handles code quality only. Use `eslint-config-prettier` so ESLint never conflicts with Prettier formatting rules.
- `.prettierignore` excludes `src/db/migrations`, `.next`, `node_modules`, and lockfiles.
- Scripts: `pnpm format` (write) and `pnpm format:check` (verify).
- Run `pnpm format` on changed files before finishing a task.

## Components and reuse

- **Build with components and avoid duplication.** Before writing new UI, check `components/ui`, `components/shared`, and the relevant feature folder for something reusable.
- If a UI pattern appears a second time, extract it into a shared component instead of copying it.
- Components are small and composable; split once a component handles more than one responsibility.
- Shared components are generic via props, not via feature-specific conditionals.
- Server Components by default; add `'use client'` only when interactivity requires it, as low in the tree as possible.
- Forms use one consistent pattern (Zod schema + server action + shared form components) across all features.
- Status badges, empty states, loading and error states use shared components so the app looks consistent.

## Design system

The visual design was created in Claude Design. These files are the source of truth for all UI:

- `docs/design/globals.css` — original design tokens (colors, typography, radius) as shadcn/ui-compatible CSS variables.
- `docs/design/COMPONENTS.md` — components, their variants, and where they are used.
- `docs/design/handoff/` — the handoff bundle exported from Claude Design: design files, screenshots of screens and states, the design chat, and its README.
- `docs/design/INDEX.md` — maps each slice in "MVP scope and build order" to the relevant files and screenshots in the handoff bundle.

Rules:

- `src/app/globals.css` uses the tokens from `docs/design/globals.css`. Never overwrite them with shadcn/ui or Tailwind defaults; when a tool regenerates `globals.css`, restore the design tokens.
- Use only tokens via Tailwind classes (`bg-primary`, `text-muted-foreground`, …). No hardcoded hex colors, arbitrary values, or custom font sizes outside the scale.
- Build components as described in `COMPONENTS.md`: same names, variants, and usage. Check it before creating any UI.
- Do not make independent styling choices. If a screen needs something not covered by the design system, propose an addition and wait for approval.
- Keep `docs/design/` unchanged; it is the reference, not working code. Only `INDEX.md` may be updated, and only when asked.
- CLAUDE.md always takes precedence over the handoff bundle's README for stack, structure, and conventions. Report conflicts instead of following the bundle.
- Before building a slice's UI, look up the slice in `docs/design/INDEX.md` and study only the referenced designs, for both desktop and mobile, including empty, loading, error, and confirmation states.
- HTML/CSS/JS from the handoff bundle is a visual reference only. Never copy it into the codebase; rebuild it with the project's shadcn/ui and shared components, tokens, and Server/Client Component conventions.
- If the design and the data model or MVP scope conflict, stop and ask instead of choosing one.
- After implementing a screen, take Playwright screenshots at desktop and 375px and compare them with the designs. List any visible differences.

## UI

- Interface language: Dutch. Code, identifiers, and commit messages: English.
- Dates formatted for `nl-BE`, times in `Europe/Brussels`.
- **The entire app must be mobile-friendly**, both the admin area and the client portal. Build mobile-first with Tailwind breakpoints (`sm`, `md`, `lg`) and verify every screen at 375px width.
- No horizontal page scrolling on mobile. Tables switch to a card/list layout on small screens via a shared responsive component.
- Touch targets at least 44×44px; no functionality that only works on hover.
- Navigation collapses into a mobile menu or bottom navigation on small screens.
- Complex views get a dedicated mobile layout instead of a squeezed desktop layout:
  - **Kanban:** one column at a time with a status switcher; moving a task via a status select as well as drag-and-drop.
  - **Calendar:** agenda/list view by default on mobile.
- Forms and file uploads must work comfortably on mobile, including uploading screenshots from the phone camera roll.
- Playwright e2e tests run on both a desktop and a mobile viewport.
- Avoid generic template styling; keep the design calm, dense, and functional.

## Email

- All email sending goes through one module: `src/lib/email.ts`. Features never call the provider directly.
- Templates live in `src/emails/`, one file per email, built with shared layout components.
- Current emails: client user invite (magic link), new ticket notification to admin, and ticket confirmation to the reporting client user.
- **New ticket notification:** sent to `ADMIN_NOTIFICATION_EMAIL` after a ticket is successfully saved. Contains client name, project name, ticket title, priority, and a direct link to the ticket in the admin area. No attachments; link to them instead.
- **Ticket confirmation:** sent only to the client user who reported the ticket, after it is successfully saved. Contains project name, ticket title, and a link to the ticket in the portal. Never includes internal information such as linked tasks.
- Client-facing emails are written in Dutch, with a clear sender name and a reply-to address that reaches the admin.
- Email failures are logged but never fail or roll back the ticket creation.
- Locally, emails are not sent to real addresses; use the provider's test mode or log them to the console.

## MVP scope and build order

Build in vertical slices: one slice = one branch = one session, delivering data layer, access checks, UI, and tests together. Build strictly in this order and only the current slice. Track progress in the checklist below and tick a slice only after it is reviewed and merged.

**0. App shell**

- [ ] 0a. Admin and portal layouts with navigation (desktop sidebar, mobile menu)
- [ ] 0b. Shared base components from `COMPONENTS.md`: StatusBadge, EmptyState, DataTable with mobile card layout, form pattern

**1. Auth**

- [ ] 1a. Admin login with email + password, logout, route protection
- [ ] 1b. Email module + client user invite via magic link

**2. Clients**

- [ ] 2a. Clients overview and detail
- [ ] 2b. Create/edit clients, manage and invite client users from the client page

**3. Projects**

- [ ] 3a. Projects overview and create/edit
- [ ] 3b. Project detail page skeleton with empty sections for tickets, agenda, documents, and tasks

**4. Object storage**

- [ ] 4. Upload helper, presigned URLs, access-checked downloads

**5. Tickets**

- [ ] 5a. Portal: report a bug with screenshot upload and confirmation state
- [ ] 5b. Emails: new ticket notification to admin and confirmation to the reporting client user
- [ ] 5c. Portal: ticket overview and detail with status
- [ ] 5d. Admin: ticket overview, status changes, tickets section on project detail

**6. Documents**

- [ ] 6a. Admin: upload documents per project with `visibleToClient`
- [ ] 6b. Portal: view and download documents

**7. Tasks**

- [ ] 7a. Task list per project with create/edit (no board yet)
- [ ] 7b. Kanban board on desktop with drag-and-drop and fractional indexing
- [ ] 7c. Mobile kanban: one column at a time with status select
- [ ] 7d. Convert ticket to task
- [ ] 7e. "All my tasks" overview across projects

**8. Agenda**

- [ ] 8a. Create/edit events per project, agenda section on project detail
- [ ] 8b. Global calendar on desktop, list view on mobile
- [ ] 8c. Client-visible events in the portal

**9. Home pages**

- [ ] 9a. Admin home page: new tickets, today and upcoming agenda, my tasks, active projects
- [ ] 9b. Client portal home page: report bug action, projects, recent tickets, upcoming events, recent documents

## Out of scope — do not build

Time tracking, email notifications other than those listed under Email (e.g. ticket status updates to clients), comments/chat on tickets, accounting or Google Calendar integrations, invoice generation, realtime updates, reporting, multi-tenancy for other freelancers, task assignees.

If a request touches these, flag it instead of implementing it.

## Working agreements

- Work in small, reviewable steps; one slice per branch (see MVP scope and build order).
- Before implementing a feature, briefly outline the plan (schema changes, actions, components) and wait for approval.
- Run `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` before declaring a task done.
- Environment variables are validated at startup with Zod and documented in `.env.example`. Never commit secrets.
