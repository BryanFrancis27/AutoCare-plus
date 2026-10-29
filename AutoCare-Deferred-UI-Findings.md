# AutoCare+ deferred UI findings

Recorded during UI-002 final dashboard refinements, 2026-10-29. These are source-confirmed follow-up findings. No vehicle-page, reminder-page, scheduling, generation, authentication, schema or RLS changes were made in this task.

## 1. Mileage units disagree across pages

Affected files:

- `src/components/vehicles/AddVehicleModal.tsx:711` labels the input `Current Mileage (miles)`.
- `src/components/vehicles/VehiclesListClient.tsx:273` and `:354` append `miles` to `current_mileage`.
- `src/components/reminders/RemindersListClient.tsx` displays the same field through `formatMileage`.
- `src/lib/maintenance/reminderCalculations.ts:269` formats mileage as `km`; its interval/urgency functions also use kilometer thresholds.
- `src/lib/maintenance/maintenanceTemplates.ts` and `src/app/actions/templates.ts` define/use `mileageIntervalKm` and `mileage_interval_km`.
- `src/components/dashboard/GarageOverview.tsx`, `UpcomingReminders.tsx`, and `src/components/maintenance/LogMaintenanceModal.tsx` must be included in the eventual consistency audit.

Finding: the same stored number is presented with different units. This is not evidence that the stored number has already been converted. Vehicle input values may have been entered under the miles label, while scheduling treats intervals as kilometers.

Proposed remedy: establish and document the canonical stored/input/display unit first. Kilometers align with the current template contracts, but existing values need an audit before relabeling or conversion. Then use shared unit-aware input labels and formatters across Vehicles, dashboard, maintenance forms and Reminders. Any correction of stored values requires a separately authorized data-repair plan; do not blindly multiply or relabel existing numbers. Test a single known vehicle end to end, including its due-mileage calculations. No conversion was performed here; the dashboard retains its existing kilometer label.

## 2. Vehicle cards imply that reminders have not been generated

Affected files:

- `src/components/vehicles/VehiclesListClient.tsx:278` always says `Add service records to generate reminders`.
- `src/app/actions/vehicles.ts:222` already calls `generateInitialReminders(vehicle.id)` after creation.
- `src/app/actions/templates.ts` generates initial reminders; maintenance actions subsequently update schedules/reminders.

Finding: the unconditional vehicle-card instruction can contradict reminders already present. A missing service history is different from a missing reminder schedule, and generated reminders do not prove that maintenance has been performed.

Proposed remedy: use neutral, accurate service-history copy such as `Record services to keep your maintenance history up to date`. If the card needs reminder-specific guidance, derive it from successful vehicle-scoped reminder data and keep loading/error/empty states distinct. Do not generate another schedule just because a card lacks service logs. Verify existing reminders and zero-history accounts during UI-003. The dashboard's new first-service guidance refers only to maintenance history.

## 3. Date and mileage reminder urgency needs a shared display contract

Affected files:

- `src/services/dashboardService.ts:106` (`relevantReminders`) classifies overdue from stored status or date, sorts by overdue/date/priority, and includes future dates only within 30 days (unless already marked overdue). Undated rows sort after dated rows. The query does not read the vehicle's current mileage.
- `src/components/dashboard/UpcomingReminders.tsx` displays due date, due mileage and an overdue badge; mileage is not used to calculate urgency.
- `src/components/reminders/RemindersListClient.tsx:74` (`getReminderStatus`) likewise checks completion, stored overdue status and date, without comparing due mileage to current mileage.
- `src/components/reminders/RemindersListClient.tsx:237` derives a `days overdue` label from the date whenever the section status is overdue. A stored-overdue reminder with a future date can therefore receive misleading date-overdue wording, even if the actual reason is mileage or stale status.
- `src/app/actions/reminders.ts` returns reminders ordered by due date and includes date-based upcoming/overdue/count projections; those projections need consistency review.
- `src/lib/maintenance/reminderCalculations.ts:74` and `:98` already expose overdue/upcoming helpers that consider date OR mileage. Their date/time behavior must be reviewed before reuse: they are not automatically a complete display contract.

Finding: date-based future reminders retain real due dates, and the dashboard's date ordering is deterministic, but neither view establishes urgency from mileage remaining. A reminder with a distant future date and an already reached mileage threshold can be omitted from the dashboard preview unless its stored status is overdue. An undated mileage reminder can rank below less urgent dated items. Labeling a reminder simply `Overdue` does not explain whether the reason is date, mileage, or stored status.

Proposed remedy: after resolving units, define one read-only presentation projection with explicit reasons: due/overdue by date, due/overdue by mileage, both, or insufficient information. Read the vehicle's verified current mileage; compare it with the actual threshold rather than inferring mileage from elapsed time. Define urgency ordering for mixed date/mileage cases, retain actual dates/thresholds, and use phrases such as `Due at 15,000 km` or `500 km remaining` only when supported by consistent data. Do not claim an overdue date if only mileage is overdue. Agree how missing/stale mileage and stored overdue status should be presented, and standardize calendar-date handling so today is not accidentally treated as overdue through UTC/local-midnight differences.

Suggested follow-up tests: due today, future-date-only, past-date-only, mileage-only with no date, threshold reached/exceeded, both triggers, missing current mileage, distant future date with breached mileage, stored-overdue with future date, completed reminders, and stable mixed-urgency ordering. Keep any scheduling/generation changes separately scoped and authorized. This task changed only reminder typography; classification, ordering and generation logic remain unchanged.

## UI-003 resolution and remaining work (2026-10-29)

The sections above retain the historical UI-002 evidence; their old vehicle-list line references predate the UI-003 card extraction.

- **Mileage labels:** UI-003 explicitly authorizes km labels with no numeric conversion. `AddVehicleModal.tsx` now labels the input `Current Mileage (km)`. `GarageVehicleCard.tsx` and the existing quick-view dialog use `formatRecordedMileage` from `src/lib/vehicles/garage-model.ts`, which delegates to the maintenance model's existing `formatMileage`. Zero remains `0 km`; missing/invalid values are labeled as missing. No database values, form number-parsing code, intervals or calculations were converted or changed. A source search found no remaining literal `miles`/`mph` labels under `src`.
- **Remaining mileage/data concerns outside this task:** `src/app/(protected)/vehicles/[vehicleId]/reminders/add/page.tsx` still has a generic `Mileage` label without a unit. `VehicleDetailsClient.tsx` checks `currentMileage` for truthiness, hiding zero, and expects camel-case `currentMileage`, `vehicleType` and `licensePlate`, while its page passes the raw snake-case row from `getVehicleById`. Normalize that detail-page contract during UI-004. Existing add/edit handling uses `parseInt` for mileage; decimal preservation through saving should be reviewed separately. Historical values entered under the former miles label still require an audit before any data-repair decision; relabeling alone does not establish their original unit.
- **Reminder-generation copy:** the unconditional `Add service records to generate reminders` message is removed from the garage cards. The replacement is neutral service-history guidance, with no extra database reads and no claim that a reminder is absent, overdue or that the vehicle is healthy. The unsupported `Active` badge is also removed. Initial reminder generation remains unchanged.
- **Mixed reminder urgency:** section 3 remains deferred in full. UI-003 does not change the dashboard, reminder views, status rules, scheduling or generation.
- **Read completeness:** `getUserVehicles` and `getVehicleServiceHistory` still use their existing unpaginated queries. Search/filter/sort operates over the owner-scoped rows returned to the page. Accounts exceeding the configured Supabase row cap need a separate pagination/completeness follow-up; no decorative metadata queries were added here.
- **Deletion reliability dependency:** `src/app/actions/vehicles.ts` deletes dependent reminders, maintenance and expenses in separate operations and ignores their individual errors before deleting the vehicle. UI-003 improves confirmation, duplicate-click protection and visible errors but does not make those backend operations transactional. A failed deletion can already have removed some dependent records; investigate/repair that server workflow separately.
- **Existing dialog/setup dependencies:** add/edit photo-upload behavior, custom add/edit and maintenance dialog focus/error handling, and the dedicated detail/setup routes remain UI-004/focused reliability work. Browser QA of the retained dialogs is still required.
- **Previously documented security concern:** the UI-001 task brief records credential exposure in Git history and requires human-managed rotation before deployment. No secret was opened, printed, copied or used for this task, and rotation status was not verified. Keep that release dependency separate from UI work.
