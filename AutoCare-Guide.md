# AutoCare+ Copilot Development Rules

This document defines **strict development, architecture, and UI rules** for GitHub Copilot when generating code for the **AutoCare+** project.

Copilot must follow these rules at all times when generating, modifying, or refactoring code.

---

# 1. PROJECT OVERVIEW

AutoCare+ is a **web-based vehicle maintenance tracking system** that helps vehicle owners:

- Track vehicle maintenance history
- Log service activities
- Receive maintenance reminders
- Manage multiple vehicles

Tech stack:

Frontend
- React
- Next.js (App Router)

Backend
- Next.js Server Actions / API Routes

Database
- Supabase (PostgreSQL)

Authentication
- Supabase Auth

Maintenance Data
- Static maintenance templates (no external APIs)

---

# 2. PROJECT STRUCTURE RULES

Copilot must follow the existing project structure.

Typical project structure:


/app
/dashboard
/vehicles
/maintenance
/settings
/auth

/components
/ui
/vehicles
/maintenance
/layout

/hooks

/lib

/services

/types

/utils

/docs


Rules:

- Pages must exist inside `/app`
- Reusable components must exist inside `/components`
- Business logic must NOT live inside page components
- Shared logic belongs in `/services`, `/lib`, or `/utils`

---

# 3. NEXT.JS APP ROUTER RULES

The project uses **Next.js App Router**.

Copilot must:

- Use `page.tsx` for page components
- Use `layout.tsx` for layouts
- Use `loading.tsx` for loading states
- Use `error.tsx` for error handling

Rules:

- Do NOT use the Pages Router
- Do NOT create `/pages` directory
- Follow App Router conventions strictly

---

# 4. COMPONENT STRUCTURE RULES

Components must be organized clearly.

Reusable UI components:


/components/ui


Domain components:


/components/vehicles
/components/maintenance
/components/layout


Examples:


VehicleCard.tsx
MaintenanceLogItem.tsx
ReminderBadge.tsx
Navbar.tsx
DashboardHeader.tsx


Rules:

- Components must be **small and reusable**
- Avoid large monolithic components
- Pages must not contain complex UI logic

---

# 5. REACT COMPONENT STANDARDS

Copilot must follow these standards.

Components must:

- Use **functional components**
- Use **TypeScript**
- Use **React hooks**
- Use **clean props typing**

Example pattern:


type VehicleCardProps = {
vehicle: Vehicle
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
return (...)
}


Rules:

- Avoid unnecessary state
- Keep components focused
- Separate UI from logic

---

# 6. SUPABASE USAGE RULES

Supabase is the **primary backend and database service**.

Copilot must:

- Use Supabase client from `/lib/supabase`
- Avoid creating duplicate Supabase clients
- Keep database queries inside **services**

Example:


/services/vehicleService.ts
/services/maintenanceService.ts


Pages must NOT contain raw database queries.

---

# 7. DATABASE DESIGN CONSTRAINTS

Primary entities:

Users
Vehicles
MaintenanceLogs
MaintenanceSchedules
Reminders

Relationships:

User → Vehicles  
Vehicle → MaintenanceLogs  
Vehicle → MaintenanceSchedules

Rules:

- Do not create unnecessary tables
- Maintain relational structure
- Use consistent naming

---

# 8. MAINTENANCE DATA STRATEGY

The system uses **static maintenance data**.

Copilot must NOT:

- Implement external automotive APIs
- Fetch OEM service schedules
- Implement predictive maintenance

Maintenance templates include:

- Oil change
- Tire rotation
- Brake inspection
- Battery check
- General inspection

These templates are used to generate reminders.

---

# 9. UI DESIGN SYSTEM

AutoCare+ follows a **clean light automotive application design** with restrained deep-red accents. This replaces the previous dark dashboard direction.

Central semantic tokens in `tailwind.config.ts`:

| Token | Value | Purpose |
| --- | --- | --- |
| canvas | #F8FAFC | Page background |
| surface | #FFFFFF | Header, sidebar, cards, dialogs, inputs |
| ink | #111827 | Primary text |
| muted | #64748B | Secondary text |
| line | #E2E8F0 | Decorative borders and dividers |
| accent | #B91C1C | Primary actions and active navigation |
| accentHover | #991B1B | Primary action hover |
| accentSoft | #FEF2F2 | Subtle emphasis and active navigation |
| onAccent | #FFFFFF | Foreground on filled accents |
| surfaceHover | #F1F5F9 | Neutral hover feedback |
| controlBorder | #64748B | Visible form-control boundaries |
| success | #166534 | Completed/healthy indicators |
| caution | #92400E | Medium priority |
| warning | #9A3412 | High priority |

Rules:

- Prefer semantic Tailwind tokens; legacy aliases support incremental page compatibility.
- Preserve the existing font stack. Body text uses 1rem/1.5; labels 0.875rem; page headings 1.5-1.875rem semibold.
- Use Tailwind's 4px spacing scale: 16-24px card padding and 8-12px control gaps.
- Dashboard and My Garage use the shared `application-workspace` convention: fluid width after the sidebar, a 1760px outer cap, and 16/24/32/40px responsive horizontal gutters. Center only once the cap is reached; do not add nested page or single-card width caps.
- Workspace container queries and content-driven grids govern card columns and toolbars. Keep reading-length limits inside text blocks; preserve the fixed header, sidebar offset, mobile drawer and normal page scrolling.
- Use 8px control radii, 12px cards, subtle shadow-card and one-pixel borders.
- Use red for primary actions, active navigation and meaningful warnings; pair status colors with text or icons.
- Use ink/muted on ordinary surfaces and white only on filled accents or dark image overlays.
- Keep keyboard focus visible and use aria-current on active routes; shell navigation targets are at least 44px.
- Mobile navigation supports Escape, focus containment/return, close control and backdrop dismissal. Hidden links must not receive focus.
- Respect reduced motion. Use subtle color changes for hover feedback without glow or movement.
- Preserve routes, authentication, logout confirmation, component structure and business workflows. Full page redesigns are separate tasks.

---

# 10. DESIGN CONSISTENCY RULE

Copilot must **analyze existing UI components before creating new ones**.

Rules:

- Reuse existing UI components
- Maintain consistent card layouts
- Follow established spacing patterns
- Follow existing typography styles

Example:

Vehicle cards, maintenance cards, and reminder cards should share similar layout patterns.

---

# 11. FEATURE IMPLEMENTATION RULE

When adding new features:

Copilot must:

1. Analyze the existing project structure
2. Identify related modules
3. Extend existing components
4. Avoid unnecessary architecture changes

Rules:

- Do not refactor large parts of the system
- Do not introduce new frameworks
- Maintain existing routing structure

---

# 12. CODE GENERATION CHECKLIST

Before generating code, Copilot must verify:

- The correct folder location
- Existing naming conventions
- Existing UI patterns
- Proper TypeScript typing
- Separation of concerns
- Reuse of existing utilities

---

# 13. PROHIBITED ACTIONS

Copilot must NOT:

- Create new architecture patterns
- Introduce external maintenance APIs
- Mix business logic inside UI pages
- Break routing structure
- Duplicate components
- Modify database schema without instruction

---

# 14. ENFORCEMENT

Any code violating these rules is considered **invalid implementation** and must be corrected.

These rules exist to maintain:

- Clean architecture
- Consistent UI
- Maintainable code
- Predictable project structure

---

Project: **AutoCare+**  
Applies To: **All Copilot-generated code**