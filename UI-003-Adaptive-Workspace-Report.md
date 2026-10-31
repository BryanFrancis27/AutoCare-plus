# UI-003 adaptive workspace refinement

Date: 2026-10-29 (Asia/Manila). Branch: feat/ui-003-my-garage.

## Root cause

Dashboard and My Garage both used mx-auto/max-w-7xl page wrappers, capping the outer page at 1280px even when the space after the sidebar was much wider. A single garage result added a second max-w-2xl (672px) grid cap. Several grids and the toolbar used viewport breakpoints, which do not describe the content width remaining after the 256px desktop sidebar appears.

The shell already reserves the sidebar through lg:ml-64 and min-w-0/flex-1. Its width calculation, fixed header, sidebar and mobile drawer did not require replacement. Those components and the protected server layout were inspected and left unchanged.

## Responsive changes

- Shared application-workspace CSS convention: 100% of available main width, a 1760px outer cap including padding, centered only after reaching that cap. Horizontal padding is 16px below 640px, 24px from 640px, 32px from 1280px and 40px from 1920px.
- Applied the convention to Dashboard and My Garage, including garage loading/error states, without another page-level cap.
- Container queries use actual workspace content width for header alignment, metric/action columns, dashboard panels, onboarding and toolbar arrangement. Four metrics/actions share width above 900px of content; two columns start at 600px. Maintenance Ahead/Recent Activity use equal columns above 900px and stack below that.
- Garage cards use an auto-fit grid with a 320px minimum that can shrink to 100% on small screens, 24px gaps and no single-card grid cap. Two/three columns fit ordinary desktop workspaces; four fit wider workspaces when enough vehicles exist. Empty auto-fit tracks collapse.
- A single visible garage result receives a presentation-only featured variant. At 720px of workspace content it uses horizontal photo/details columns; below that, its full-width image and details stack. Existing actions, card styling, metadata and image-failure behavior remain. Reading lengths and action groups inside wide featured cards are bounded without constraining the page.
- The garage toolbar fills the workspace. It stacks on narrow content, uses two columns from 560px, and puts search/type/sort/reset in one row above 900px. Values, options, reset handlers and filtering/sorting logic are unchanged.
- Dashboard garage overview uses an auto-fit preview grid and a content-responsive single-vehicle photo/detail layout. Onboarding keeps its copy, steps and action, adapting to two columns only when the content can support them. Text blocks retain deliberate reading-length limits.
- No new page-height/overflow scrolling container or clipping workaround was added. Normal page scrolling and existing modal scrolling are retained.
- Dashboard modals were moved alongside, rather than inside, the query-container element. This avoids CSS containment changing the containing block for their fixed overlays. Existing callbacks and modal components were retained.

## Exact files changed in this refinement

1. AutoCare-Guide.md
2. src/app/styles/globals.css
3. src/app/(protected)/dashboard/page.tsx
4. src/components/dashboard/DashboardOnboarding.tsx
5. src/components/dashboard/GarageOverview.tsx
6. src/components/vehicles/VehiclesListClient.tsx
7. src/components/vehicles/GarageToolbar.tsx
8. src/components/vehicles/GarageVehicleCard.tsx
9. src/components/vehicles/VehicleImage.tsx
10. src/app/(protected)/vehicles/loading.tsx
11. src/app/(protected)/vehicles/error.tsx
12. UI-003-Adaptive-Workspace-Report.md (added)

No files removed. Existing UI-003 edits/untracked files were preserved. No services, queries, calculations, CRUD actions, authentication, RLS, schemas, route definitions, search/filter/sort logic or dependencies were modified. No commit, push, merge or deployment was performed.

## Nominal viewport behavior from source calculations

These are calculated CSS expectations, not rendered browser test results. Widths assume the nominal CSS viewport without an additional classic scrollbar gutter. Real container queries automatically respond to the measured available width; scrollbars, zoom and long content can change a threshold crossing. Garage column counts assume enough matching vehicles to fill the grid.

| Viewport | Sidebar | Outer workspace | Inner content | Metrics/actions | Garage columns | Single result | Toolbar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 375px | drawer | 375px | 343px | 1 | 1 | stacked | stacked |
| 640px | drawer | 640px | 592px | 1 | 1 | stacked | two-column controls |
| 768px | drawer | 768px | 720px | 2 | 2 | horizontal if threshold met | two-column controls |
| 960px | drawer | 960px | 912px | 4 | 2 | horizontal | one row |
| 1024px | 256px | 768px | 720px | 2 | 2 | horizontal if threshold met | two-column controls |
| 1152px | 256px | 896px | 848px | 2 | 2 | horizontal | two-column controls |
| 1280px | 256px | 1024px | 960px | 4 | 2 | horizontal | one row |
| 1366px | 256px | 1110px | 1046px | 4 | 3 | horizontal | one row |
| 1440px | 256px | 1184px | 1120px | 4 | 3 | horizontal | one row |
| 1600px | 256px | 1344px | 1280px | 4 | 3 | horizontal | one row |
| 1920px | 256px | 1664px | 1584px | 4 | 4 | horizontal | one row |
| 2560px | 256px | 1760px | 1680px | 4 | 4 | horizontal | one row |

The 1024px sidebar transition intentionally reduces available width relative to a 960px viewport with the drawer hidden. Narrow desktop content therefore keeps two metric columns instead of forcing four cramped cards. At 1920px the workspace uses the available main width; at 2560px it centers at the requested ultrawide cap. Mobile and intermediate widths remain content-driven rather than inheriting desktop column counts from viewport size alone.

## Validation

- node --test tests/dashboard-data.test.cjs tests/garage.test.cjs: PASS, 41/41 existing tests.
- npx.cmd tsc --noEmit --incremental false: PASS.
- npm.cmd run lint: PASS; existing next/no-img-element warning in AddVehicleModal.tsx.
- npm.cmd run build: original-output attempt blocked by EPERM opening the existing .next/trace. PASS for an isolated production build using byte-identical application source/configuration: node node_modules/next/dist/bin/next build .local-validation/ui003-workspace-build (exit 0, all 14 static pages generated). Existing dependencies/environment were reused without copying or printing environment files. Compiled CSS includes the shared workspace and container rules. Temporary build files were removed after verification. Existing image, Browserslist, ES-module and Reminders DYNAMIC_SERVER_USAGE diagnostics remain; Reminders is emitted as dynamic.
- git diff --check: PASS. New/changed file encoding and whitespace checks included in final validation.
- TypeScript AST comparison against the start-of-task snapshot: all existing JSX event/callback expressions in the changed TSX files are unchanged.
- Source geometry evaluated at all six requested widths plus intermediate 640/960/1152/1280/1440/1600px widths. The table above records those predictions; this is not a browser layout engine or overflow audit.
- Browser inventory returned no browsers/apps and a native-helper pipe error. No screenshot, desktop/mobile visual, keyboard, drawer, modal, image or authenticated interaction checks were executed.

## Remaining QA and limitations

Check 375/768/1024/1366/1920/2560px and intermediate widths in a connected browser: populated and first-time dashboard, one and many vehicles, search/type/sort/reset, long names/plates/prices, photo cropping/fallbacks, consistent card alignment, overflow/page scrollbars, fixed header/sidebar clearance, mobile drawer, focus and all dialogs/actions. Test save/refresh behavior with a test account. Existing mocked data, server-rendered markup and callback tests do not prove live Supabase or browser behavior.

The implementation uses CSS container queries, auto-fit grids and container-relative sizing; compatibility and visual fit in the target browsers remain unverified. The 720px featured threshold can switch around a scrollbar/zoom boundary, intentionally following actual available width. Visual regressions cannot be ruled out until browser QA is completed. No existing data/workflow regression was detected by the 41 available automated tests and callback-source comparison.
