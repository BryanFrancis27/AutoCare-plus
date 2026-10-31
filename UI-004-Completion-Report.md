# AutoCare+ UI-004 completion report

Date: 2026-10-30 (Asia/Manila)

## Summary of Changes

Implemented the dedicated vehicle profile and repaired `/vehicles/[vehicleId]/edit`. The edit route and Garage Add/Edit use one guided three-step form. The layout uses the existing light palette, shared controls, application workspace and 1760px cap. No dependency, authentication/OAuth, schema/migration/RLS, scheduling, reminder-generation or cost-arithmetic changes were made. No commit, push, merge or deployment was performed. Pre-existing untracked roadmap/task/report files were preserved.

## Exact Files

Modified:

- `src/app/(protected)/vehicles/[vehicleId]/page.tsx` — owner-scoped read and normalized detail composition.
- `src/app/(protected)/vehicles/[vehicleId]/edit/page.tsx` — populated dedicated editing instead of the static stub.
- `src/app/actions/vehicles.ts` — shared read normalization, safe detail-read results, nullable ownership clears, authenticated photo upload/signing and renewal. Removed automatic public-bucket provisioning.
- `src/app/actions/maintenance.ts` — paginated complete statistics and latest-service ordering; retained existing cost arithmetic.
- `src/components/vehicles/VehicleDetailsClient.tsx` — vehicle profile, specifications, maintenance/reminder overview, existing workflow actions and independent read errors.
- `src/components/vehicles/AddVehicleModal.tsx` — shared inline/modal guided form, validation, submission guards and photo states.
- `src/components/vehicles/VehiclesListClient.tsx` — added Open Vehicle Details link inside retained quick view.
- `src/components/vehicles/VehicleImage.tsx` — optional local blob preview with the existing image fallback.
- `src/lib/vehicles/garage-model.ts` — allow missing model year in the typed vehicle contract.
- `src/components/reminders/RemindersListClient.tsx` — matching nullable-year prop type only; no reminder UI/policy redesign.
- `src/components/ui/Dialog.tsx` — working outer-overlay dismissal and reduced-motion-aware animation; retained focus containment/return and Escape.
- `AutoCare-Deferred-UI-Findings.md` — UI-004 resolutions and remaining dependencies.

Added:

- `src/app/(protected)/vehicles/[vehicleId]/loading.tsx`
- `src/app/(protected)/vehicles/[vehicleId]/error.tsx`
- `src/app/(protected)/vehicles/[vehicleId]/not-found.tsx`
- `src/components/vehicles/EditVehicleClient.tsx`
- `src/components/vehicles/VehicleReadError.tsx`
- `src/lib/vehicles/vehicle-model.ts`
- `src/lib/vehicles/image-processing.ts` — extracted existing canvas compression, dimensions, limits and GIF behavior.
- `src/services/vehicleService.ts`
- `tests/vehicle-details.test.cjs`
- `UI-004-Completion-Report.md`

No files were removed.

## Functional Improvements

The profile displays the persisted image, identity, plate, classification, mileage, supported specifications, ownership information and notes. Missing values have explicit placeholders; zero mileage and price remain visible. Mileage uses the existing km formatter without converting stored values, and spending uses the existing PHP formatter. Legacy aliases are supported when canonical columns are absent; explicit canonical null/empty values remain authoritative. VIN is omitted because the inspected schema does not establish support.

Maintenance statistics read all pages, retain vehicle/user predicates, check completeness, and sort by service date so the latest record supplies last-service information. Counts/costs come from real records; failed reads show a retry state. The profile links to existing maintenance history and opens the existing Log Maintenance workflow for this vehicle. Open reminders come from the existing vehicle-scoped action, with priority, recorded status, due date and due mileage shown separately. No health scores or predictive information were added. Reminder creation and all-reminder navigation remain available.

The edit route loads the actual vehicle and reuses the Garage form inline. Basic Information, Technical & Mileage Details, and Ownership & Photo retain entries when moving backward/forward. Required fields follow the previous form contract. Free-text make/year inputs also preserve older/custom persisted values. Field-associated errors cover whitespace-only required values, model year, non-finite/negative/malformed numbers and invalid dates. Submission preserves decimals and zero, and empty optional ownership inputs clear to null. Save validates every step, uses an immediate duplicate-submission guard, waits for an actual returned row, and updates local Garage state from persisted data. Failure preserves the draft and shows safe feedback; confirmed success refreshes data and returns dedicated editing to its detail page with a success message. Cancel returns without saving.

Photos support compression, local preview, replacement and explicit Remove Photo. Unsupported types, processing errors, size limits, upload failure and signing failure retain the draft; a failed upload does not silently save the vehicle without the requested photo. Blob URLs are released when replaced/removed/closed/unmounted. The shared image handles invalid/missing/load-failed sources. Authenticated storage operations use existing policies; no public access is provisioned. Same-project owner-folder signed references are refreshed on vehicle reads without rewriting database values.

Invalid IDs are rejected before a query. Valid reads require the authenticated owner. Missing, deleted and foreign vehicles use the same not-found message. General reads and route failures have safe retry states without internal errors or identifiers. Associated information is loaded only after the selected vehicle read succeeds.

## Validation

| Command/check | Actual result |
| --- | --- |
| `node --test tests/dashboard-data.test.cjs tests/garage.test.cjs` | PASS: 41 existing tests |
| `node --test tests/dashboard-data.test.cjs tests/garage.test.cjs tests/vehicle-details.test.cjs` | PASS: 62 tests, including 21 new UI-004 tests |
| `npx.cmd tsc --noEmit --incremental false` | PASS |
| `npm.cmd run lint` | PASS: no warnings or errors |
| `npm.cmd run build` | PASS: production compilation, type/lint checks and 14 static pages; protected vehicle routes are dynamic |
| `git diff --check` | PASS |
| Local production HTTP smoke check | PASS: `/login` 200; unauthenticated `/vehicles`, vehicle detail and edit routes 307 to `/login`. Test server stopped afterward. |

Tests execute real normalization/validation/mapping modules, server-render real detail markup, invoke real form handlers using a small injected hook harness, and mock Supabase/actions. Coverage includes snake-case/legacy mapping; explicit clears; zero/missing/invalid numbers; all editable field population; step retention; decimal/date validation; duplicate submission; confirmed persisted success; safe failure retention; Cancel; reminder association/completion; preview/fallback; replacement/upload failure/removal; authenticated storage errors; signed URL origin/owner boundaries; malformed/missing/foreign/unauthenticated reads; mutation owner scoping and revalidation; independent overview failures; and statistics across 1,102 records. These are CLI/model/component checks, not browser hydration, real compression, focus, network persistence or deployed RLS evidence.

Build warnings remain: outdated caniuse-lite/Browserslist data, a Node ES-module notice, and the existing caught `/reminders` cookies/DYNAMIC_SERVER_USAGE messages during static generation. The build exits successfully and classifies that route as dynamic. No packages or environment values were changed.

## Known Issues and Manual QA

Browser availability check returned no connected apps/browsers and an unavailable native computer-use pipe. No browser, authenticated Supabase CRUD, visual layout, keyboard/modal or real Storage upload acceptance is claimed.

Complete with a test account:

- Create a vehicle, including zero mileage, then open its dedicated profile from Garage quick view.
- Edit every supported field, navigate between steps, Cancel, retry a failed save, save successfully and refresh both profile and Garage/Dashboard.
- Clear purchase date/price/notes and photo; ensure old values do not return after refresh.
- Upload, replace, remove and retry photos; test missing, broken and expired URLs and deployed owner storage policies.
- Open maintenance history, log maintenance, create a reminder and verify only the selected vehicle's associated data appears.
- Check missing/deleted/foreign IDs in an authenticated session, and independently failed maintenance/reminder reads.
- Verify desktop/tablet/mobile layout, long content, zoom/no horizontal overflow, Tab/Shift+Tab, Escape/outside dismissal, focus return, processing/save guards and reduced motion.

Storage dependency: the existing `vehicles` bucket and appropriate owner-folder INSERT/SELECT/signing policies must already exist. This task does not provision them or change existing public exposure. Durable object-path references, independently querying Dashboard/Reminders photo renewal, and orphan-object retention/cleanup need separate backend decisions. Replacing/removing references does not delete storage objects.

Existing legacy schema compatibility loops can omit unsupported fields; only returned persisted values are reported as saved. Reminder/list/history response caps, concurrent-read consistency, historical mileage provenance, nontransactional vehicle deletion and reminder write integrity remain follow-up concerns. The previously documented credential exposure/rotation dependency was not re-investigated; no secret was read or used. See AutoCare-Deferred-UI-Findings.md for detail.

## Recommended Next Task

**UI-005 — Maintenance & Service Reminders.** Preserve existing policies while addressing the deferred mixed due-date/mileage presentation contract and retained custom dialog accessibility. Complete UI-004 browser and deployed-policy QA before treating persistence and visual acceptance as verified.
