# UI-005 investigation — 2026-10-31

Baseline: clean worktree on feat/ui-005-maintenance-reminders. Reviewed guide, deferred findings, actions, calculations, dashboard service, vehicle details, shared Dialog and Node harness before implementation.

- Reminders persist owner/vehicle, title/type/category/description, date/mileage, priority, intervals, status, completion and notes. Existing modal requires date OR mileage. Dedicated reminder route is a non-submitting placeholder.
- Maintenance persists owner/vehicle, service type/category/date, mileage (km), cost (PHP), notes/receipt and calculated next due fields. Keep category defaults and calculateNextDue formulas.
- Date OR mileage triggers and upcoming windows of 30 days OR 500 km exist in reminderCalculations. Priority is separate. Date-only comparisons currently mix timestamps/timezones.
- Reuse shared focus-managed, reduced-motion Dialog and adaptive application-workspace. Node harness transpiles actual modules with injected mocks.
- Maintenance Edit route exists at /maintenance/[maintenanceId]/edit; read/update are owner-filtered. Modal/page numeric parsing, validation and error handling diverge.

## Findings before changes

- High: completeReminderWithServiceLog completes first, ignores insert errors, can log again when already completed, and records today's service at zero cost with fallback mileage. Require explicit informed confirmation in UI; atomicity/idempotency repair is separate backend work.
- High: createMaintenanceRecord creates a log and next reminder, then completes the closest pending reminder. Follow-up errors are ignored; the new reminder can itself be selected. Preserve write ordering/generation pending backend remediation.
- High: creation accepts vehicle IDs without an explicit owner-vehicle lookup, relying on deployed RLS/FKs. Add authenticated ownership verification before new writes.
- Medium: history and reminder reads can be truncated. Use exact-count checked stable paging; fail rather than show partial totals.
- Medium: truthiness hides zero, parseInt truncates decimals, negative/nonfinite values lack validation, exceptions can strand forms, duplicate submissions lack synchronous guards.
- Medium: reminder detail latest-service errors are ignored, potentially appearing as absent history.

Deferred: transactional completion/logging, concurrency/idempotency, generated reminder linkage, update/delete schedule synchronization, deployed RLS and historical unit provenance. No schema, authentication, RLS or interval changes.
