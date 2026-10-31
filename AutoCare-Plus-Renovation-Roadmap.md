# AutoCare+ — Renovation Roadmap

**Project:** AutoCare+ (Next.js 14 App Router, React 18, TypeScript, Tailwind CSS 3, Supabase, Vercel)

**Goal:** Transform the existing dark administrative dashboard into a friendly, polished, white-and-red vehicle ownership companion for real users and portfolio visitors, without compromising existing data or security.

**Source basis:** October 28, 2026 read-only local codebase investigation, October 29 UI screenshots, and confirmed successful email/password login after the paused Supabase project was resumed. The current production behavior of Google OAuth and database write flows is still unverified.

## Product direction

- **Product promise:** Your digital garage — understand each vehicle's condition, upcoming service, and costs at a glance.
- **Audience:** Individual vehicle owners; first-time visitors; public portfolio reviewers.
- **Design:** Bright, calm, premium consumer app. White cards, soft gray workspace, charcoal text, restrained deep-red accent. Avoid red-on-white low-contrast labels and excessive red panels.
- **UX principles:** Actionable before analytical; first-time guidance; progressive disclosure; clear feedback; responsive and keyboard accessible; honest loading/error/empty states.
- **Preserve:** Next.js App Router, Supabase backend and RLS, existing domain architecture, existing user records, and reusable components where possible.
- **Do not claim:** Live email or push reminder delivery unless implemented and tested. Static maintenance guidance must not be presented as OEM-certified advice.

## Visual foundations

| Semantic role | Proposed token | Hex | Usage |
| --- | --- | --- | --- |
| Brand primary | `brand-primary` | `#B91C1C` | Main CTA, active navigation |
| Page canvas | `bg-canvas` | `#F8FAFC` | Application background |
| Surface | `bg-surface` | `#FFFFFF` | Sidebar, cards, dialogs |
| Text primary | `text-primary` | `#111827` | High-emphasis copy |
| Text muted | `text-muted` | `#64748B` | Secondary labels |
| Border | `border-subtle` | `#E2E8F0` | Outlines and separators |
| Brand soft | `brand-soft` | `#FEF2F2` | Selected row backgrounds |

Use semantic tokens via a central Tailwind/CSS layer, not scattered hard-coded colors. Validate contrast, focus styles, hover states, and touch targets. Inter or Geist are acceptable typography candidates; choose one consistent system rather than adding many fonts.

## Ordered milestones and tasks

### M0 — Safety & functional baseline (required before a public release)

| ID | Priority | Task | Exit criteria |
| --- | --- | --- | --- |
| SEC-001 | P0 | Revoke/rotate publicly committed Google OAuth secret; update Supabase provider; remove tracked credential, block future commits, assess history cleanup | Old credential invalid; replacement configured; repository cleaned without exposing new secret |
| SEC-002 | P1 | Repair parent-vehicle authorization gaps and harden `SECURITY DEFINER` mileage trigger | Two-user isolation tests demonstrate cross-user writes fail; migrations reviewed and applied deliberately |
| AUTH-001 | P1 | Verify Google OAuth on current production URL and improve callback/session handling | Password + Google auth, denial, callback errors, session refresh, logout pass |
| QA-BASE | P1 | Capture baseline build, lint, TypeScript, route and data verification | Reproducible tests; unchanged records; known outstanding defects documented |

**Status:** Email/password login and reading the dashboard/vehicles/reminders/profile screens were observed after Supabase restored. Google OAuth and live write workflows are not yet verified. SEC-001 is an immediate human-managed credential rotation, not a Codex-only action.

### M1 — New design system and application shell

| ID | Priority | Task | Exit criteria |
| --- | --- | --- | --- |
| UI-001 | P1 | Introduce semantic white/red theme tokens and update existing design guidance | Single theme source, documented component rules, no regressions |
| UI-002 | P1 | Renovate shared navigation: top bar, sidebar, mobile drawer, active states | Consistent light shell across protected routes, keyboard/touch accessible |
| UI-003 | P1 | Renovate primitive buttons, form inputs, cards, badges, dialogs, loading/error states | Reused components with consistent design and clear focus/error treatment |
| UI-004 | P2 | Refresh landing, sign-in and registration while preserving auth logic | Clear existing-user entry, white/red product narrative, responsive auth experience |

**Initial coding assignment:** UI-001 + UI-002 only, as one reviewable vertical slice. Do not redesign feature pages or change Supabase logic in that change. Update `AutoCare-Guide.md` dark-theme-only rule to the approved new light theme.

### M2 — Core daily-use journeys

| ID | Priority | Task | Exit criteria |
| --- | --- | --- | --- |
| UX-001 | P1 | Guided first-run onboarding and meaningful empty states | New user can add a first vehicle and knows next steps |
| VEH-001 | P1 | Repair vehicle details field mapping and dedicated vehicle edit | Saved data displays and edits consistently |
| VEH-002 | P1 | Visual garage cards, vehicle photo/metadata, search/filter/sort | Easily locate and open a vehicle on mobile/desktop |
| DASH-001 | P1 | Personalized home/dashboard with primary vehicle, upcoming tasks, quick actions | Dashboard answers 'What should I do next?' including zero-data state |

### M3 — Reliability of service tracking

| ID | Priority | Task | Exit criteria |
| --- | --- | --- | --- |
| MAINT-001 | P1 | Make maintenance and reminder transitions correct, transactional and idempotent | No duplicate or accidentally completed next reminders |
| REM-001 | P1 | Redesign reminder planner, date/mileage urgency and completion | Overdue/upcoming/completed agree with rules and persisted data |
| MAINT-002 | P2 | Receipt upload/view/delete and durable storage references | Authorized owner-only lifecycle and safe file restrictions |
| EXP-001 | P2 | Reliable categorized cost history and clear date-window totals | Charts and totals reconcile with source maintenance records |

### M4 — Portfolio differentiators

| ID | Priority | Task | Exit criteria |
| --- | --- | --- | --- |
| DEMO-001 | P1 | Public `/demo` guided exploration without account | Visitors explore dashboard, garage, reminders, records, cost views without authentication or real-user access |
| DEMO-002 | P1 | Reuse real app visual components with clearly labelled synthetic fixtures | No Supabase writes/real user data; simulated actions are isolated, reversible, and resettable |
| ANA-001 | P2 | Service cost and frequency charts | Meaningful summaries with empty/error states and date/vehicle filters |
| EXPORT-001 | P2 | Owner-authorized PDF/CSV vehicle maintenance history exports | Correct data, no other user's records, safe formatting |
| POLISH-001 | P2 | Microinteractions, subtle transitions, responsive improvements | Reduced-motion support, no unnecessary animations or performance regressions |

**Demo safety rules:** Public demo uses deterministic, synthetic fixture data and separate demo-mode adapters; it must not bypass production authentication or database RLS. Do not use a shared privileged Supabase demo account. Clearly label actions simulated and include a 'Create my garage' conversion CTA. Test anonymous route access and cross-mode isolation.

### M5 — QA, documentation and release

| ID | Priority | Task | Exit criteria |
| --- | --- | --- | --- |
| QA-001 | P1 | Auth, authorization, vehicle CRUD, reminder idempotency and demo boundary tests | Automated critical-path tests pass |
| QA-002 | P1 | Responsive, keyboard, focus, screen-reader and reduced-motion QA | No major a11y, contrast, responsive or dialog failures |
| DOC-001 | P2 | README, architecture, screenshots, sample tour, deployment guide | Visitors and maintainers understand features and setup |
| RELEASE-001 | P1 | Preview review, environment verification, rollout/rollback plan | No secrets in repo; production smoke tests pass; deployments explicitly approved |

## First implementation task — UI-001 + UI-002

**Goal:** Establish the white/red design system and renovate shared app chrome without changing backend functionality.

**Primary files to inspect first:**
- `AutoCare-Guide.md` — currently mandates black/red theme; user now authorizes changing those UI rules.
- `tailwind.config.ts`, `src/app/styles/globals.css`, `src/app/layout.tsx`
- `src/components/layout/Sidebar.tsx`, `src/components/dashboard/DashboardHeader.tsx`, `src/components/layout/ProtectedLayoutClient.tsx`
- `src/components/ui/{Button,Card,Input,Dialog}.tsx` for potential shared style compatibility.

**Scope:** Semantic color tokens, background/surfaces, typography and component state conventions, updated guide, light desktop sidebar/header/mobile navigation. Add only compatibility adjustments needed to prevent unreadable existing feature screens; full page redesigns belong to following tasks.

**Do not touch:** Supabase/auth config, database/migrations/RLS, core business logic, route names, API contracts, real user data, or packages without approval. No Git push or Vercel deployment.

**Acceptance:**
1. Every protected page has a coherent white/light-gray shell with accessible active navigation, no broken links, and functional mobile drawer.
2. Theme tokens come from one documented central source; red is used for primary actions and state emphasis, not large background slabs.
3. The guide's design rules match the new direction without weakening architectural/security rules.
4. Existing content remains legible (contrast, borders, focus) and critical forms continue working.
5. TypeScript, lint, build and manual viewport checks pass; report exact modified files and known follow-ups.

**Notes:** The design renovation can be developed locally, but do not deploy any changes until the exposed OAuth secret is revoked/rotated and the remaining security release blockers are addressed.
