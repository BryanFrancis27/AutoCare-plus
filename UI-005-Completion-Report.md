# UI-005 — Maintenance & Service Reminders

Local implementation on `feat/ui-005-maintenance-reminders`, 2026-10-31 (Asia/Manila). No commit, push, merge or deployment. No dependencies, schema, migrations, RLS, OAuth, interval formulas or reminder-generation algorithms changed.

## Summary of changes

- Reminders: adaptive workspace, scoped active/overdue-or-reached/completed summaries, vehicle selection with plate identification, search, schedule filters, date/priority sorting, reset, separate read-error/empty/no-result states and accessible details. Date, mileage and priority are separate. Completed reminders remain inspectable. Creation is available for the selected vehicle.
- Shared status presentation across Reminders, Vehicle Details and Dashboard. Dashboard reads recorded vehicle mileage and includes breached mileage reminders with distant dates; its preview remains bounded to five items.
- Maintenance history: vehicle identity/navigation, all-record count/spending/latest-service summaries, chronological records, category/type search, inclusive date/category filters, service-date/cost sorting, reset and clear empty states. Totals remain independent of filters. Records retain notes and calculated next due information.
- Maintenance Edit route exists and is retained. Add, modal and Edit share MaintenanceForm, validation and mapping; Edit preserves an existing receipt reference. Updates constrain owner, record and vehicle association.
- Shared light maintenance/reminder fields, required indicators, field-associated errors, pending feedback, same-render duplicate guards, exception handling and retained drafts. Zero mileage/cost and decimal values are preserved. Reminder creation retains date OR mileage requirements and its existing category/type choices.
- The dedicated reminder route now submits through the shared form, replacing its nonfunctional placeholder. Reminder creation and maintenance creation explicitly verify the vehicle belongs to the authenticated owner before inserting.
- Retained completion behavior is explained before an explicit performed-service confirmation. UI feedback says the reminder was updated and asks users to review history, rather than claiming the legacy service write was verified. Users can instead log actual service details.
- Forms use the established focus-managed Dialog, portal, dismissal/focus-return and reduced-motion behavior. Available content width drives grids, with wrapping controls and bounded dialog scrolling.

## Reminder status contract

Projection only; persisted state is not mutated by presentation.

1. `isCompleted` or stored `status === completed` takes precedence over other scheduling signals.
2. A valid date earlier than local calendar today is overdue. Today is within the due-soon window, not overdue. Stored overdue status is retained with the explicit reason `Stored status: overdue`; it never invents days past a future date.
3. With finite non-negative recorded vehicle mileage and threshold, current mileage >= threshold means `Mileage threshold reached`. Overdue summaries include this group. If date or stored status is also overdue, the overdue label takes precedence and mileage remains a separate reason.
4. Due soon means within 0–30 calendar days OR within 0–500 km, reusing existing helper windows. Date and mileage use OR, not AND.
5. Other evaluable future dates/remaining distances are scheduled. A mileage-only reminder without reliable recorded vehicle mileage is insufficient information, while its actual threshold is still displayed. Missing/invalid due fields remain neutral. A valid date can still establish scheduling when mileage is unknown.
6. Low/Medium/High/Critical priority is independent of schedule; unsupported priority is unknown. Priority sorting is an explicit user choice.
7. Strict date-only validation and UTC day arithmetic compare calendar keys, avoiding DST and UTC parsing shifts. Calendar today follows the runtime's local date (browser local after hydration); no new business timezone is imposed. Stored date display uses the calendar date without timezone conversion. Application-wide authoritative timezone policy and midnight rollover remain manual acceptance considerations.
8. Mileage stays in canonical km; no stored-number conversion or historical-unit repair. Remaining mileage uses recorded odometer values, with no claim of freshness.

## Functional validation

- `node --test tests/*.test.cjs`: **102 passed, 0 failed** (80 existing regressions plus 22 UI-005 cases).
- Existing Dashboard, Garage, Vehicle Details and Vehicle Editor coverage executed in full. Dashboard's test loader now resolves real shared modules; its empty-state assertion follows the new neutral wording.
- Focused cases cover date-only/mileage-only/combined triggers, priority independence, completed/stored-overdue/missing information, local-midnight/DST/timezone boundaries, history filters/sorts/totals, >1000 rows, lower response caps, incomplete/changed/duplicate pages, zero/decimal values, invalid dates/numbers, concurrent submit guards, failure/retry/draft retention, owner associations, edit/update/delete scope, completion confirmation and retained integrity defects.
- `tsc.cmd --noEmit --incremental false`: passed.
- `npm.cmd run lint`: passed without warnings/errors.
- Standard workspace `npm.cmd run build`: passed. Existing cookie-based dynamic-render diagnostic for `/reminders` and outdated Browserslist notices are nonfatal. No dependency update was made.
- Isolated-build workaround: **not used**; standard build succeeded.
- `git diff --check`: passed after final report completion.
- Task-owned production HTTP smoke test: all five changed protected workflows returned HTTP 307 to `/login` without a session (Reminders, history, maintenance add, reminder add, maintenance edit). This verifies unauthenticated protection only; the task-owned server was stopped.

These are source/model/action-mock/component-render and CLI checks. They do not prove actual browser layout, keyboard focus, authenticated persistence or deployed database behavior.

## Deferred findings

See the UI-005 section of `AutoCare-Deferred-UI-Findings.md` for severity and remediation. High-priority retained findings are nontransactional completion/logging, ignored follow-up insert errors, repeated logs on repeated completion and next-reminder creation followed by ambiguous closest-reminder completion. They are characterized by tests, not fixed through schema or scheduling changes.

New local guards prevent concurrent submits from a mounted form, but do not establish backend idempotency across tabs, interrupted responses or multiple callers. Checked paging detects several incomplete-read cases but cannot promise a transactional snapshot. Garage option/history reads and Dashboard's pre-existing generic pagination have separate completeness limitations. Existing historical unit, storage and credential-release dependencies remain unverified.

## Browser acceptance checklist — pending

Computer-use inventory failed: native pipe unavailable. No live browser/Supabase tests were executed. Manually verify:

- Empty account and empty vehicle, one/multiple vehicles, plate selection, completed/overdue/mileage-only/missing-mileage reminders and all filters.
- Distant date with reached mileage, today in local timezone, stored overdue with a future date, and identical labels across Dashboard/Reminders/Vehicle Details.
- History with zero/decimal spending, many records, all sort/filter/reset combinations, empty/no-result/read-error distinctions and Edit navigation/persistence.
- Reminder creation in modal/page, maintenance creation in modal/page, editing, failed-save draft retention, interrupted-response review and retries.
- Explicit completion confirmation, actual resulting service date/mileage/cost, refresh across surfaces, and backend remediation reproductions in a controlled account.
- Mobile/desktop widths, sidebar-constrained widths, zoom, no overflow/clipped inputs, scrollable dialogs, Tab/Shift-Tab containment, Escape/backdrop dismissal, focus return and reduced motion.
- Owner isolation with separate accounts and deployed RLS, plus actual Supabase persistence. Do not use a production account for integrity-failure characterization.

## Next task

UI-006 — Profile & Account Settings. Complete the pending UI-005 browser/backend acceptance and track backend remediation independently.

## Exact files

37 added/modified files. No files removed.

- Modified: `AutoCare-Deferred-UI-Findings.md`
- Modified: `src/app/(protected)/maintenance/[maintenanceId]/edit/EditMaintenanceForm.tsx`
- Modified: `src/app/(protected)/maintenance/[maintenanceId]/edit/page.tsx`
- Modified: `src/app/(protected)/reminders/page.tsx`
- Modified: `src/app/(protected)/vehicles/[vehicleId]/maintenance/add/AddMaintenanceForm.tsx`
- Modified: `src/app/(protected)/vehicles/[vehicleId]/maintenance/add/page.tsx`
- Modified: `src/app/(protected)/vehicles/[vehicleId]/maintenance/page.tsx`
- Modified: `src/app/(protected)/vehicles/[vehicleId]/reminders/add/page.tsx`
- Modified: `src/app/actions/maintenance.ts`
- Modified: `src/app/actions/reminders.ts`
- Modified: `src/app/styles/globals.css`
- Modified: `src/components/dashboard/UpcomingReminders.tsx`
- Modified: `src/components/maintenance/LogMaintenanceModal.tsx`
- Modified: `src/components/reminders/AddReminderModal.tsx`
- Modified: `src/components/reminders/RemindersListClient.tsx`
- Modified: `src/components/vehicles/VehicleDetailsClient.tsx`
- Modified: `src/services/dashboardService.ts`
- Modified: `src/types/index.ts`
- Modified: `tests/dashboard-data.test.cjs`
- Added: `UI-005-Completion-Report.md`
- Added: `UI-005-Investigation.md`
- Added: `src/app/(protected)/reminders/error.tsx`
- Added: `src/app/(protected)/reminders/loading.tsx`
- Added: `src/app/(protected)/vehicles/[vehicleId]/maintenance/error.tsx`
- Added: `src/app/(protected)/vehicles/[vehicleId]/maintenance/loading.tsx`
- Added: `src/app/(protected)/vehicles/[vehicleId]/reminders/add/ReminderPageForm.tsx`
- Added: `src/components/maintenance/MaintenanceField.tsx`
- Added: `src/components/maintenance/MaintenanceForm.tsx`
- Added: `src/components/maintenance/MaintenanceHistory.tsx`
- Added: `src/components/reminders/ReminderForm.tsx`
- Added: `src/components/reminders/ReminderSchedule.tsx`
- Added: `src/lib/maintenance/forms.ts`
- Added: `src/lib/maintenance/history-model.ts`
- Added: `src/lib/maintenance/presentation.ts`
- Added: `src/lib/maintenance/read-complete.ts`
- Added: `src/lib/maintenance/use-confirmed-submit.ts`
- Added: `tests/maintenance-reminders.test.cjs`
