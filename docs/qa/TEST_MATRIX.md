# Test Matrix

Statuses refer to the final local source run documented in `TEST_RESULTS.md`. “Not Run” means no browser automation or manual browser inspection was performed.

| Feature | Scenario | Preconditions / action | Expected result | Actual result | Status | Automated coverage |
| --- | --- | --- | --- | --- | --- | --- |
| Case data | Every case has four suspects, five evidence items, three hints, valid IDs | Load all JSON cases | No broken clue, timeline, answer, hint, or connection references | Verified by validator and assertions | Pass | `caseEngine.test.ts` |
| Accusation | All complete selections | Enumerate 4 suspects × 5 method × 5 motive for each case | Exactly one intended answer succeeds; same clue is rejected | 300 combinations enumerated | Pass | `caseEngine.test.ts` |
| Accusation | Empty/malformed/unknown/foreign/same evidence | Call pure engine directly | Distinct rejection outcome; no solution accepted | Covered for every case | Pass | `caseEngine.test.ts` |
| Accusation | Correct answer after finalization | Set finalized argument | `already-solved` | Verified | Pass | `caseEngine.test.ts` |
| Connections | Configured clue pairs | Compare each pair and reverse order | Same connection and insight is returned | All 15 configured connections matched oracle; clue pairs symmetric | Pass | `caseEngine.test.ts` |
| Connections | Invalid clue/person pair matrix | Enumerate all unordered clue pairs, repeated clue pairs, and clue/suspect pairs | Only configured relationships match | Matrix evaluated for all three cases | Pass | `caseEngine.test.ts` |
| Connections | Uncollected/foreign/duplicate IDs | Call matcher with IDs outside eligible sets | No connection returned | Verified | Pass | `caseEngine.test.ts` |
| Evidence discovery | First and repeated UI examination | Click evidence, revisit it | Count and activity increase once; details remain reviewable | Pure state handler inspected; browser interaction not run | Not Run | No component/E2E test |
| Evidence inspection | Open/close/turn/zoom/filter | Use workspace controls | Correct observation, interpretation, selected filter and empty state | Source inspected only | Not Run | No component/E2E test |
| Suspects | Profile, interview, accusation synchronization | Select cards/dropdown and log interviews | One selected suspect; one interview record per suspect | Shared React state and duplicate guard inspected | Not Run | No component/E2E test |
| Hints | Order, maximum, persistence, difficulty cost | Request hints repeatedly | Hints stop at configured count; activity number is sequential | Functional update now guards solved/max state; no browser journey run | Partial | Source review; no component test |
| Scoring | Story / Standard / Expert | Calculate with hint/wrong-guess penalties | Documented penalty and multiplier produce deterministic integer score | Existing score examples pass; persisted result score is checked | Pass | `caseEngine.test.ts`, `progress.test.ts` |
| Achievements | Evidence, solution, no-hint, clean-close, all-cases | Evaluate progress snapshots | Award only when matching progress/result exists | Verified by unit test | Pass | `achievements.test.ts` |
| Persistence | Unknown and duplicate IDs | Restore malformed case save | Drop unknown cases/IDs and deduplicate lists | Verified | Pass | `progress.test.ts` |
| Persistence | Result copy mismatch / invalid score | Restore mismatched result snapshots | Do not render solved case or count result | Verified for mismatched copies; localStorage is not tamper-proof | Pass with limitation | `progress.test.ts` |
| Persistence | Reload a full real playthrough | Solve through browser, reload | Same solved score and evidence restored | No browser installed | Not Run | No E2E test |
| Sharing | Valid link round trip and `/ciphercase/` path | Encode and decode result | Valid result preserved; static-site path remains | Verified in Node | Pass | `sharing.test.ts` |
| Sharing | Malformed, unknown, out-of-range result | Decode bad share payload | Return `null`, show no invented result | Verified | Pass | `sharing.test.ts` |
| Responsive/accessibility | 320–1440px layouts, keyboard and reduced motion | Browser interaction and viewport checks | No overflow; essential actions keyboard accessible | Not inspected in browser | Not Run | None |
| Browser/runtime | Console, network, double-click and mobile interaction | Complete three real cases | No uncaught errors or missing assets | Playwright/browser binaries unavailable | Not Run | None |
| Production path | GitHub Pages build base | `npm run build:pages` | Generated assets use `/ciphercase/` | Build completed; live hosting not checked | Pass locally | Build script |
| CI workflow | Typecheck, tests, Pages build | Inspect `.github/workflows/pages.yml` | Quality gates run before upload/deploy | Existing workflow contains all three commands | Pass by source inspection | Workflow |
