# AutoCare+ Project Report

## Executive Summary
AutoCare+ is a Next.js 14 App Router application for vehicle maintenance tracking. The codebase is a full-stack Supabase-backed product with email/password and Google OAuth authentication, protected user dashboards, vehicle CRUD, maintenance logging, reminder management, profile views, and a static maintenance recommendation engine. The project is designed around a single primary user role: the vehicle owner.

The implementation matches the project documents in its core direction: static maintenance guidance, no external automotive APIs, and a clean dark dashboard UI. The strongest parts of the project are the Supabase auth/data flow, reminder generation logic, and the modular maintenance template system. The main weakness is that the codebase is still uneven in completeness across the wider feature set, with some features present as UI affordances or partial flows rather than fully isolated CRUD modules.

## Technology Stack
- Frontend: React 18, Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Lucide icons
- Backend: Next.js Server Actions and Route Handlers
- Database and auth: Supabase PostgreSQL, Supabase Auth, Supabase Storage, RLS policies
- Build and tooling: npm, TypeScript, ESLint, PostCSS, Autoprefixer
- Hosting target: Vercel, based on the documentation

## What the App Actually Does
### Authentication
The app supports email/password registration and login, plus Google OAuth. The auth flow is built with Supabase server-side and browser-side clients, a callback route, and a protected layout that redirects unauthenticated users back to login.

### Dashboard
The dashboard is the main authenticated landing page. It loads live metrics from Supabase for total vehicles, maintenance records, active reminders, and monthly expenses. It also combines recent vehicle additions and maintenance entries into a short activity feed, and exposes quick actions for adding a vehicle, logging maintenance, opening expenses, and navigating to reminders.

### Vehicles
Vehicle management is a real CRUD surface. The server actions support creating, updating, deleting, loading, and image-uploading vehicles. Vehicle creation also triggers initial reminder generation using the maintenance template engine.

### Maintenance Logs
Maintenance records are stored in `maintenance_logs` and include service type, category, date, mileage, cost, notes, receipt URL, next due date, next due mileage, and priority. Creating or updating a maintenance record recalculates the next service date/mileage and can create or complete related reminders automatically.

### Reminders
Reminder management includes fetching all reminders, upcoming reminders, overdue reminders, single reminder details, create/update actions, completion, snoozing, and a completion flow that can optionally write a maintenance log and schedule the next reminder.

### Profile and Access Control
The profile page shows account metadata from Supabase. Protected routes are handled in the app layout, and unauthorized users are redirected away from private pages.

## Maintenance Engine
This is one of the project’s core differentiators.

The maintenance system is intentionally static and rule-based. The documents and code agree on this decision: no OEM APIs, no predictive diagnostics, and no live telematics. Instead, the app uses curated maintenance categories and templates for common service items such as oil changes, tire rotation, brake inspection, battery checks, filters, fluid checks, and EV-specific items.

The engine adds three layers of logic:
- Vehicle classification by type, powertrain, and age group
- Template expansion for gasoline, hybrid, EV, SUV, and pickup patterns
- Light manufacturer adjustments for selected makes/models such as Toyota, Honda, and Ford

Reminder calculations are deterministic. Due dates and due mileage are derived from the last service date, service mileage, and category intervals. Driving condition modifiers are also implemented for oil changes, suspension, cooling, and brake-related intervals.

## Data Model and Database Behavior
The migration script extends the schema for `vehicles`, `maintenance_logs`, and `reminders` with richer fields such as vehicle type, powertrain, current mileage, purchase details, next due data, priorities, and completion flags.

Important database behavior is built into the migration:
- Row-level security is enabled on the main tables
- Owner-based policies restrict read/write access by `auth.uid()`
- A trigger updates vehicle mileage when maintenance is logged
- Indexes are added for the most common reminder and vehicle queries

This means the project is not just a UI shell; it has a defined persistence and ownership model.

## UI and Structure
The UI follows the repository’s own design rules: dark background, white text, red accent color, rounded cards, and responsive layouts. Framer Motion is used for page and card entrance effects, and the app is split into reusable component groups under `src/components` for auth, dashboard, forms, layout, maintenance, reminders, UI primitives, and vehicles.

The app route structure is organized around:
- Public landing and auth pages
- Protected dashboard, vehicles, reminders, maintenance, and profile pages
- Supporting debug and unauthorized pages

## Documentation vs Implementation
The project documentation is mostly aligned with the code, but a few things are worth noting:
- Expense tracking exists in the dashboard and delete flow, but there is no standalone expense CRUD module in `src/app/actions`
- File upload support is implemented for vehicle images, which goes beyond the minimum feature spec and uses Supabase Storage
- The docs mention optional email notifications and analytics, but those are not implemented in the code shown
- The project intentionally uses static maintenance data, and the implementation follows that rule consistently

## Current Risk Notes
- The TypeScript config still reports a deprecation warning for `target: es5` in `tsconfig.json`
- Several flows depend on environment variables being present, especially Supabase credentials and the app URL
- Some feature areas are broader in the docs than in the code, so the implementation is strongest in auth, vehicles, reminders, and maintenance history, but less complete around standalone expense analytics and notifications

## Bottom Line
AutoCare+ is a well-scoped capstone-style maintenance tracker with a solid Supabase-backed core. Its implemented center of gravity is vehicle ownership, maintenance logging, and reminder generation. The project is coherent, modular, and consistent with its own maintenance-data strategy, with the main remaining gaps being a few partially realized feature areas and a TypeScript config warning.