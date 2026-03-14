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

AutoCare+ follows a **clean dark dashboard design**.

Primary colors:

Background
→ Black

Accent
→ Red

Primary Text
→ White

Neutral UI
→ Gray

Rules:

- Avoid introducing random colors
- Maintain strong contrast
- Use red only for highlights, warnings, and active states

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