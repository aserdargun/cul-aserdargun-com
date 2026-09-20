# Local verification — 2026-09-20

Verified on macOS with Node 22.23.1. App: `http://127.0.0.1:8036`. Production-build smoke: `http://127.0.0.1:8037` (temporary test server, stopped after the tests).

## Executed checks

| Check                                          | Result                                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| TypeScript + Vite production build             | PASS; complete static `dist/`, bundled local fonts                                                                          |
| Vitest domain tests                            | **27 passed**                                                                                                               |
| Playwright Chromium UI tests                   | **24 passed**, 3 workers, about 1.1 minutes                                                                                 |
| Production-build Chromium smoke                | **2 passed**, stable scenario with both strategies                                                                          |
| npm audit (all dependencies)                   | **0 vulnerabilities reported**                                                                                              |
| npm ci dry-run                                 | PASS; lockfile is installable (dry run, not a clean-machine installation)                                                   |
| Formatting                                     | Prettier check passed for source, tests and scripts                                                                         |
| Codex IAB direct interaction                   | First experiment visibly completed; reset returned to Ready; console error query empty                                      |
| Page identity / blank page / framework overlay | CUL title and heading asserted; content rendered; initial font-import error fixed before final QA                           |
| Responsive                                     | 320, 390, 768 and 1440px: no whole-page horizontal overflow; bounded Atlas scroll remains available                         |
| Native concept-size capture                    | 1488 × 1056px screenshot captured; complete-page desktop and mobile screenshots also inspected                              |
| Visual review                                  | Generated reference and current render opened with `view_image`; see `DESIGN.md` for comparisons and intentional deviations |
| Local lifecycle                                | Foreign listener on 8031 was detected and preserved. Managed CUL start/stop/restart on 8036 exercised.                      |

Commands actually executed:

```sh
npm run validate
CUL_PREVIEW=1 npx playwright test -g 'Kararlı arayüz /'
npm audit
npm ci --dry-run --ignore-scripts
npx prettier --check 'src/**/*.{ts,tsx,css}' 'tests/*.ts' 'scripts/*.mjs'
npm stop
npm start
```

## Domain coverage

- Both strategies complete each of the five non-approval scenarios with exactly one persisted write.
- Approval scenario requires explicit approval in both strategies, consumes it once, and blocks rejection.
- Identical inputs produce identical runs/events.
- Stale coordinates stop before wrong-target effects; ambiguous names do not silently choose the first match.
- Disabled/covered targets do not receive writes; missing labels and permanent blocks hand off within budget.
- Unauthorized operation is denied inside the engine regardless of UI state.
- Target/content changes and approvals from another run are rejected.
- Missing receipt does not trigger a repeated write; the explicit blind-repeat counterexample does.
- Reset rejects an old run's pending transition; replay is detached, pure data.
- Coordinate observations do not contain roles or private record IDs; semantic observations do not contain geometry or private record IDs.

## User-visible browser coverage

- All six scenarios × two strategies, with downloaded JSON and observed form/write-count results.
- Play, step, pause (step count remains stable), reset while playing, history inspection with disabled execution controls.
- User sorting, search, filter, overlay, manual field edit/save and empty list.
- Content edit before approval refreshes the proposal; rejection leaves the record unarchived.
- TR → EN → TR mid-run preserves run identity and semantic proposal, and displays translated saved value.
- Comparison runs all six scenarios, including independent approval/rejection decisions.
- 320 / 390 / 768 / 1440px runs with zoom, reversed ordering, scroll recovery and no page overflow.
- At 115% scale after actual browser scrolling, the target outline's x/y/width/height match the real rendered row's DOM bounding box; the correct record is then updated once.
- Keyboard skip link and Enter → edit → Tab → Enter save path.
- Cold load requests only local resources; console/page errors are captured and asserted empty.
- Methods cycle, responsive layout and verified primary-source links.

## Findings fixed during work

1. A changed approved draft retained a stale proposal. Intervention now discards that proposal and requests a fresh observation and approval.
2. List-model scrolling exceeded the actual scrollable range. Model and actuator now clamp to the rendered list range.
3. Local variable-font import used a nonexistent subset entry. Corrected to the package export; no remote font request remains.
4. A full-page screenshot exposed an offscreen skip-link artifact. Clip-based hiding preserves keyboard access and eliminates the artifact.
5. Dependency audit reported two moderate development-dependency issues. Vitest was updated to 4.1.11; final audit reports zero.

## Explicit limits

- Chromium and Codex IAB only. Safari, Firefox, physical touch devices and screen-reader software were not tested.
- No formal WCAG certification, exhaustive browser matrix or adversarial security audit.
- No real model, screenshot understanding, OCR, desktop control, external accounts or field integrations.
- Coordinate observations are a synthetic scene model; verifications use labelled internal state.
- Session data is memory-only. Exports are downloadable but not imported or persisted automatically.
- No production publish, DNS/TLS/domain verification or neighbouring repository changes. The intended domain is only a plan.
