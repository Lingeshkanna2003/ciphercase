# CipherCase QA Audit

## Scope and version

- Audited source baseline: commit `5f044e0` plus the uncommitted workspace changes recorded in this QA pass.
- Audit date: 2026-11-01.
- Scope: accusation validation, case data references, deduction connections, saved progress, score calculation, achievements, share links, type checking, and local production builds.
- No source changes were merged or deployed.

## Architecture and gameplay inventory

| Feature | Implementation |
| --- | --- |
| Case catalog and narrative | `src/data/cases/*.json`, `src/data/cases/index.ts` |
| Accusation validation and score | `src/lib/caseEngine.ts`, called by `src/App.tsx` |
| Clue discovery and interview records | `src/App.tsx`, displayed by `src/components/CaseWorkspace.tsx` |
| Evidence inspection and filters | `src/components/CaseWorkspace.tsx`, `src/components/EvidenceArtifact.tsx` |
| Deduction-board comparisons and ordering | `src/components/DeductionBoard.tsx`, validated by `findCaseConnection()` |
| Hints and difficulty | `src/App.tsx`, `src/lib/caseEngine.ts` |
| Browser persistence | `src/lib/progress.ts` and `localStorage` |
| Achievements | `src/lib/achievements.ts` |
| Shared result links | `src/lib/sharing.ts`, `src/components/ShareResultScreen.tsx` |
| Static hosting build | `vite.config.ts`, `npm run build:pages`, `.github/workflows/pages.yml` |

The workspace also includes the investigation timeline, private notes, suspect profiles, field log, solution view, responsive styles, and local brand/case artwork. Sound playback is no longer part of the current source.

## Baseline and repaired checks

Before QA fixes, `npm test` passed 11 tests, `npm run typecheck` passed, and both `npm run build` and `npm run build:pages` completed. The existing accusation tests checked a few examples only; they did not enumerate the 300 complete suspect/method/motive combinations.

The implementation now validates accusation shape, case membership, separate method and motive clues, and finalized-case state. The deduction board uses a shared pure matcher that only accepts known, available evidence and suspects. Restored progress is restricted to IDs belonging to its case, duplicate IDs are removed, and a solved state is retained only when both saved result copies agree and the score is consistent with the recorded difficulty and penalties.

The added unit suite enumerates 300 complete accusation combinations and all configured clue-pair/person-pair connections, including reversed clue pairs and invalid combinations. It also checks saved-state cleanup, achievements, and malformed share links. Final verification passed 28 tests across four files, TypeScript checking, both production builds, and `git diff --check`.

## Test environment and limitations

- Unit tests run in Vitest’s Node environment; the suite does not render React components in a browser.
- TypeScript checking and normal/GitHub Pages production builds are available locally.
- Playwright and browser binaries are not installed in this workspace. An authorized install attempt failed because the npm registry hostname could not resolve (`ENOTFOUND`). No Chromium, Firefox, or WebKit gameplay journey was run.
- The provided live GitHub Pages URL could not be opened with the available web tool. A local build is not evidence that the deployed site is current or working.
- Coverage instrumentation was not configured, so no coverage percentage is claimed.
- Browser storage is client-side and editable by the device owner. The save checks detect malformed, inconsistent, and impossible-score records; they are not cryptographic anti-cheat protection.
- Case reasoning is a narrative audit of authored text. It cannot establish real-world forensic certainty, and some opportunities rely on the mystery’s stated character accounts being accurate.

## Defects and release readiness

See `BUG_REPORT.md` for reproduction, cause, and fixes. The audit also found and corrected two narrative consistency defects: the Clockwork Garden brief said five people were present although it has four suspects, and the Blue Hour Score brief placed the score at midnight even though its evidence placed the swap before the 9:48 p.m. lockup. Clue text now identifies the Blue Hour copying equipment and its access record consistently.

**Release recommendation: NOT VERIFIED.** Local logic tests, type checking, and build checks can establish useful confidence, but the requested browser playthroughs, keyboard/mobile checks, console inspection, and deployed-site verification remain unrun.
