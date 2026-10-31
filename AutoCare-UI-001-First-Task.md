# AutoCare+ — UI-001 + UI-002: Light Theme Foundation and Application Shell

Refer to `AutoCare-Guide.md` and the read-only local investigation report first. The user has explicitly approved replacing AutoCare+'s previous black/red requirement with a white, light-gray, and deep-red visual system; update the guide's UI sections accordingly while preserving all other architecture/security rules.

## Context

- Stack: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS 3, Supabase.
- Existing signed-in pages: dashboard, vehicles, reminders, profile and their detail routes.
- Preserve existing workflows and data; current email/password login works after Supabase restoration.
- A public Google OAuth client secret is exposed in Git history. This requires a separate human-managed rotation and is a blocker for deployment; do not print, copy, or use it.

## Goal

Create a cohesive, modern, **white-and-red automotive consumer app shell**, replacing the dark administrative look. This task covers the shared foundation, not a full per-page redesign.

## Design system

- Background `#F8FAFC`, surfaces `#FFFFFF`, main text `#111827`, muted text `#64748B`, borders `#E2E8F0`, primary red `#B91C1C`, pale red `#FEF2F2`.
- Use semantic theme tokens in `tailwind.config.ts` and/or shared CSS rather than scattering raw colors.
- Use restrained red for CTAs, active navigation, and meaningful indicators.
- Define hierarchy, consistent spacing, border radius, shadows, hover/focus states, and accessible contrast. Preserve existing typography unless a consistent upgrade is justified.
- Support desktop/tablet/mobile and reduced motion.

## Scope

1. Inspect `tailwind.config.ts`, `src/app/styles/globals.css`, `src/app/layout.tsx`, and `AutoCare-Guide.md`.
2. Inspect and renovate `src/components/layout/Sidebar.tsx`, `src/components/dashboard/DashboardHeader.tsx`, and `src/components/layout/ProtectedLayoutClient.tsx`.
3. Establish shared theme primitives and update only the components strictly required for a coherent light shell; check `src/components/ui/` for style conflicts.
4. Keep existing navigation routes, logout actions, authentication state, modal behavior, and business logic unchanged.
5. Ensure remaining dark legacy screens have readable surfaces, text, inputs, and dialogs during the transition. Minimize compatibility fixes and identify full page redesigns as follow-up tasks rather than absorbing them into this PR.
6. Update the design guidance in `AutoCare-Guide.md` to match the white/red direction.

## Non-goals / Constraints

- Do not modify Supabase clients, environment variables, OAuth handlers, authentication actions, database schema, RLS, triggers, vehicle/maintenance/reminder logic, or seed data.
- Do not introduce a new UI framework or major dependency without an explicit rationale and approval.
- Do not commit, push, deploy, or run production migrations.
- Do not change page/route URLs or remove working features.

## Acceptance criteria

- Light shell appears consistently on dashboard, vehicles, reminders, and profile.
- Active route, sidebar collapse/drawer, focus/keyboard navigation, top bar, and logout still work.
- Mobile and tablet layouts avoid overflow/overlap; test narrow and wide viewports.
- Cards, text, modal triggers, and existing forms have readable contrast with no dark-on-dark or white-on-white regressions.
- One central set of semantic colors governs shell styling and is documented.
- TypeScript, ESLint, and production build succeed, and any warnings are reported.

## Validation and completion report

Run `npx tsc --noEmit --incremental false`, `npm run lint`, and `npm run build` (or project-appropriate equivalents); document actual results. Manually verify page navigation and key interactions in local development and note checks not executable in the current environment.

Report: changes, exact files edited, before/after UI behavior, validation, risks, and next recommended tasks. **Stop after local implementation and validation; do not push or deploy.**
