# AutoCare+ UI-004-R2 completion report

Date: 2026-10-30 (Asia/Manila)
Branch: `feat/ui-004-vehicle-details-setup`

## Summary of Changes

Replaced the dedicated Edit Vehicle wizard with a single-page Vehicle Editor. Basic, Technical and Ownership sections are immediately available, alongside a compact Vehicle Photo card and live draft summary. The Add Vehicle experience retains its three-step guided wizard. Garage cards and quick view now link to the same dedicated edit route as the existing Vehicle Details action; the competing edit modal and its state/callback were removed.

The existing UI-004 profile, data normalization, owner-scoped actions, service statistics and reminder behavior were retained. R2 does not change authentication/OAuth implementations, database/schema/migrations/RLS, storage policies/visibility, maintenance calculations or reminder generation. No dependency or environment file was changed. Existing dirty UI-004 work and untracked reports were preserved. No commit, push, merge, deployment or PR creation was performed.

## Files Modified

Paths below describe this R2 increment. Files already untracked from UI-004 are listed as edited here when they existed before R2.

Edited:

- `src/app/(protected)/vehicles/[vehicleId]/edit/page.tsx` — key the editor by persisted vehicle ID so a different vehicle starts with its own state.
- `src/components/vehicles/EditVehicleClient.tsx` — complete editor workspace, draft summary, direct save, dirty state, discard confirmation and native unload protection.
- `src/components/vehicles/AddVehicleModal.tsx` — create-only wizard presentation using the shared controller and fields.
- `src/components/vehicles/GarageVehicleCard.tsx` — canonical Edit Vehicle route link; retained View/Delete/Maintenance/Expenses callbacks.
- `src/components/vehicles/VehiclesListClient.tsx` — removed edit modal; added canonical editing to quick view.
- `src/components/vehicles/VehicleImage.tsx` — opt-in contained image in a bounded frame, preserving other image presentations and fallbacks.
- `src/lib/vehicles/vehicle-model.ts` — shared field labels, required-field definitions and dirty comparison.
- `src/lib/vehicles/use-vehicle-garage.ts` — removed obsolete modal-edit state.
- `src/app/styles/globals.css` — content-width-based editor columns within the existing adaptive workspace.
- `src/components/layout/ProtectedLayoutClient.tsx` — scoped navigation guard provider around shell and page content.
- `src/components/layout/Sidebar.tsx` — explicit guarded navigation links.
- `src/components/dashboard/DashboardHeader.tsx` — guarded existing dashboard/profile links; no header redesign.
- `src/components/layout/LogoutButton.tsx` — guard opening the existing logout confirmation; retained the original confirmation and logout action.
- `src/app/(protected)/dashboard/page.tsx` — removed the obsolete create-mode prop from its existing Add Vehicle action; no dashboard redesign.
- `tests/garage.test.cjs` — updated edit-link assertions while preserving callback coverage for other card workflows.
- `tests/vehicle-details.test.cjs` — migrated wizard-edit tests to the extracted shared controller, retaining mapping/read/storage/detail coverage.
- `AutoCare-Deferred-UI-Findings.md` — R2 outcomes and current validation/acceptance limits.

Added:

- `src/lib/vehicles/use-vehicle-form.ts` — shared state, baseline/dirty comparison, validation, photo lifecycle, submission and confirmed-save handling.
- `src/components/vehicles/VehicleFormFields.tsx` — shared accessible field rendering and legacy-option preservation.
- `src/components/vehicles/VehiclePhotoField.tsx` — shared photo preview, replacement/removal/undo and upload guidance/status.
- `src/components/layout/NavigationGuard.tsx` — explicitly registered navigation guard and guarded shell link.
- `tests/vehicle-editor.test.cjs` — 18 focused R2 tests.
- `tests/vehicle-test-helpers.cjs` — in-memory TypeScript loader and hook harness with effect cleanup.
- `UI-004-R2-Completion-Report.md` — this report.

Removed files: none. The modal editing workflow and obsolete modal-edit state were removed from existing files. UI-004's `VehicleDetailsClient`, `image-processing`, `vehicleService`, vehicle server actions and maintenance/reminder server actions were not edited during R2.

## Architecture

`useVehicleForm` owns the initial persisted baseline, draft fields, dirty comparison, field errors, duplicate-request lock, retry state, photo processing and persistence. Both presentations use the existing `vehicleFormValues`, `validateVehicleForm`, `vehicleSubmission` and `confirmedVehicleSave` functions. Existing normalization retains canonical null/empty clears, missing-column legacy aliases, zero and decimals. `VehicleFormFields` shares labels, descriptions, input states and validation associations; persisted legacy select values remain selectable. `VehiclePhotoField` shares the existing compression implementation and URL cleanup with bounded contained presentation.

`AddVehicleModal` owns only its step index, step validation/focus and guided presentation. It cannot open an independent editing flow. `EditVehicleClient` presents every supported field simultaneously, supplies the saved vehicle to the same controller, and adds workspace navigation/dirty protection. Save still calls the existing owner-scoped `updateVehicle`; only a confirmed returned persisted row triggers refresh and detail navigation. The existing server action continues to revalidate Garage, detail and Dashboard paths.

The shell's small navigation provider accepts one explicitly registered page guard. Sidebar and existing header links ask that guard before navigating. Logout requests the guard before opening its unchanged confirmation workflow. No global click capture, patched router methods, history sentinels or navigation loops were introduced. Without an editor guard, these controls navigate immediately as before.

## User Experience

The header provides Back to Vehicle Details, the persisted vehicle identity, a supporting description, an announced status and Save Changes/Cancel. Save is disabled for pristine or reverted forms; a failed save permits an explicit retry. Saving and photo processing disable conflicting controls and guard shell navigation immediately. Every field is validated on Save, field errors reference their input, and the first invalid field or failure summary receives focus. Errors keep all entries and requested photo changes intact. A successful save returns to the existing detail page with confirmed success feedback.

The main column contains three compact sections with consistent icon headings, two-column fields where space permits and a full-width Notes field. At sufficient workspace width a secondary column holds the bounded photo and a draft summary. Narrow layouts stack in DOM reading order. The footer save controls remain accessible with a bottom-sticky surface; header and footer layering stay below the fixed shell. No nested page-width cap was added. Existing semantic tokens, focus styles, Dialog focus containment/return and reduced-motion behavior are reused.

The photo card distinguishes current saved photo, local replacement and pending removal. Replace/Remove/Undo operate on the draft until Save. Missing/failed images use the existing fallback; previews use object-contain in a fixed-height frame. Object URLs are released on replacement, undo, removal, successful save, close and unmount. Late processing results are ignored after cleanup. Unsupported/oversized/failed images preserve the previous preview. Upload/save failures do not claim success or silently omit the requested photo.

Dirty Back, Cancel and integrated shell actions show Keep Editing/Discard Changes using the existing Dialog. Keep Editing, Escape or outside dismissal leaves the draft intact; Discard continues the requested action without a Supabase write. Pristine cancellation leaves immediately. Refresh/tab close uses supported native beforeunload behavior while dirty/processing/saving. Browser-controlled warnings depend on browser rules and prior interaction; native same-document Back/Forward is not intercepted. Modifier/new-tab clicks remain native and leave the editor open.

## Validation

| Command/check | Result |
| --- | --- |
| `node --test tests/dashboard-data.test.cjs tests/garage.test.cjs tests/vehicle-details.test.cjs` | PASS: 62 existing tests after adapting tests to extracted logic/canonical edit navigation |
| `node --test tests/dashboard-data.test.cjs tests/garage.test.cjs tests/vehicle-details.test.cjs tests/vehicle-editor.test.cjs` | PASS: 80 tests, including 18 focused R2 tests |
| `npx.cmd tsc --noEmit --incremental false` | PASS |
| `npm.cmd run lint` | PASS: no warnings or errors |
| `npm.cmd run build` in the working checkout | BLOCKED: EPERM opening `.next/trace`; elevated retry stalled and its task-owned build process was stopped |
| Isolated `next build` using the same source, configs and installed packages | PASS: exit 0, compilation, type/lint checks and 14 static pages; vehicle edit remains dynamic |
| Isolated production HTTP smoke checks | PASS: `/login` returned 200; unauthenticated Garage, detail and edit returned 307 to `/login` |
| `git diff --check` | PASS |

For the isolated build, a temporary `.ui004-r2-validation` folder copied source/public and existing package/config files, resolved the already installed parent dependencies and inherited the local environment in memory. No dependency install, environment-file copy or source-config change was needed. Its server was stopped and the entire temporary folder was removed after checks. Existing local Next.js servers were left running. The root trace permission/lock cause was not conclusively established; isolated success is not a claim that the standard checkout command passed.

New tests cover every populated editable field; initial pristine state; changes/reversal for every field; legacy select options; field error associations; required/numeric/date validation; zero/decimals and explicit clears; actual persisted-response mapping; failed-save retry/retention; duplicate requests; photo replacement/removal/undo; object URL cleanup and late completion; pristine and dirty cancellation; Keep Editing/Discard/dismissal; registered shell requests; native unload listener lifecycle, including photo processing; successful refresh/detail navigation; all three Add Vehicle steps with Back/Next retention; canonical edit navigation; and native modifier-click behavior. Retained UI-004 tests still cover upload failure retention, explicit photo removal, server ownership, missing records and signed-URL boundaries.

Tests render real server markup and invoke real hooks/handlers with injected actions/Supabase and a small hook harness. They do not execute browser hydration, real compression/canvas, actual focus movement, native browser prompts, remote persistence, or deployed RLS/Storage policies. No such acceptance is claimed.

The isolated build still reports existing Browserslist/caniuse-lite age, a Node ES-module notice and caught `/reminders` cookies/DYNAMIC_SERVER_USAGE diagnostics. It exits successfully and lists Reminders as dynamic.

## Known Issues and Pending Acceptance

- Browser inventory returned no apps/browsers and an unavailable native computer-use pipe. Verify 390px mobile, tablet, desktop and ultrawide layouts with real interaction; check overflow/zoom, contained images, long text, footer layering, keyboard labels/focus, Tab/Shift+Tab/Escape, focus return and reduced motion.
- Use an authenticated test account to edit each supported field, save and refresh, check Garage/Dashboard, cancel pristine/dirty forms, retain drafts after real failures, and test required values, decimals, zero and optional clears.
- Verify native refresh/tab-close prompts after user interaction, shell/header/logout navigation and the intentional browser-history limitation. Check that Keep Editing retains focus/drafts and cancelled logout still leaves the editor usable.
- Exercise real upload, replacement, removal, Undo Photo Change and failures with deployed storage permissions. Existing bucket/owner-folder policy requirements, signed-reference renewal limitations, unreferenced upload objects and cleanup/retention decisions from UI-004 remain unchanged.
- Existing backend schema-compatibility loops may omit unsupported fields, and prior data-integrity/security findings remain deferred as documented. No secret was inspected or rotated, no policy was altered, and rotation status is unverified.
- Resolve the local generated `.next/trace` access issue separately before relying on the normal workspace production-build command. The isolated build validates current source, not the health of the existing dev process or a deployment.

## Next Task

**Finish UI-004 acceptance testing and prepare PR #4 before beginning UI-005.** This R2 task stops after local implementation and validation; no PR, commit, push, merge or deployment was performed.
