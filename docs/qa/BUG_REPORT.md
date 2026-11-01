# Bug Report

## CC-QA-001 — Accusation boundary did not distinguish invalid inputs

- **Severity:** P2
- **Reproduction:** Call `checkAccusation()` with a missing field, a non-string value, an unknown suspect/evidence ID, or the same clue in both evidence fields.
- **Expected:** Distinct validation result for incomplete, malformed, foreign-case, duplicate-clue, and already-solved submissions. Only two collected case clues and one case suspect can form an accusation.
- **Actual before fix:** The function only checked empty values, collection, then equality with the answer. Invalid IDs were not explicitly checked, same-clue submissions had no distinct validation, and malformed `null` input could throw.
- **Root cause:** Engine relied on the component selectors to constrain inputs.
- **Fix:** Added runtime shape and case-membership checks, separate method/motive enforcement, and finalized-case outcome. The app maps these rejections to feedback.
- **Verification:** Exhaustive 300-combination matrix and negative input tests in `src/lib/caseEngine.test.ts`.

## CC-QA-002 — Deduction matching lived only in the component

- **Severity:** P1
- **Reproduction:** Compare arbitrary selected IDs or reverse a configured evidence pair.
- **Expected:** A pure rule should check that the pair belongs to this case, is currently available, and is configured; reversed evidence order should remain valid.
- **Actual before fix:** Matching was inline in `DeductionBoard`; no exhaustive unit coverage validated eligibility, person pairings, or invalid pairs.
- **Root cause:** Relationship validation was coupled to rendering state.
- **Fix:** Extracted `findCaseConnection()` into `caseEngine.ts`; board calls the same matcher and supplies only collected evidence.
- **Verification:** All 15 configured connections and all clue/person combinations are enumerated in `caseEngine.test.ts`.

## CC-QA-003 — Restored case lists trusted arbitrary and duplicate IDs

- **Severity:** P2
- **Reproduction:** Add unknown, repeated, or cross-case evidence/suspect/connection IDs to the saved JSON and reload.
- **Expected:** Only unique IDs defined by the matching case should be restored; connection IDs require their evidence to be collected.
- **Actual before fix:** String arrays were accepted without case-level validation, which could inflate home counters or restore impossible board state.
- **Root cause:** Save sanitization validated types and lengths but not membership or uniqueness.
- **Fix:** Restore known case-specific IDs, deduplicate them, and filter connections/order against collected evidence.
- **Verification:** Malformed save regression in `progress.test.ts`.

## CC-QA-004 — A partial solved-result record could unlock completion

- **Severity:** P1
- **Reproduction:** Store a result in only `cases[id].result` or only `results[id]`, then reload.
- **Expected:** A solved state and awards should require the duplicate persisted records to agree and the score to match the recorded difficulty/penalties.
- **Actual before fix:** Each copy was independently cleaned; a case result could render solved even when the summary result was absent, or a summary could count without a matching case result.
- **Root cause:** Two persisted representations were not reconciled.
- **Fix:** Validate result schema/score and require both copies to match before restoring completion; otherwise discard the orphaned result.
- **Verification:** Mismatched-copy regression in `progress.test.ts`.
- **Limit:** Local storage remains editable. A malicious user can forge matching records; the current static, offline game has no trusted server or cryptographic signature.

## CC-QA-005 — Hint updates could log stale hint numbers on rapid repeated input

- **Severity:** P2
- **Reproduction:** Trigger the hint action repeatedly before React commits the next render.
- **Expected:** Functional updates increment from the latest state, never exceed the case maximum, never add hints after solve, and log sequential numbers.
- **Actual before fix:** The activity message used a render-captured hint count, even though the updater incremented from current state.
- **Root cause:** The displayed hint number came from a stale closure.
- **Fix:** Compute the number inside the functional state update and guard completed cases.
- **Verification:** Typecheck and tests pass; a React interaction test for rapid events remains unrun.

## CC-QA-006 — Narrative facts contradicted their own timeline

- **Severity:** P1
- **Reproduction:** Compare the briefs with suspect counts and timeline/evidence for the Clockwork Garden and Blue Hour Score.
- **Expected:** The incident summary, evidence timestamps, access window, and final reconstruction should describe one possible sequence.
- **Actual before fix:** Clockwork Garden said five people were present despite defining four suspects. Blue Hour Score said the original remained at midnight while its copy-machine record placed the replacement work at 9:36 p.m. and the door lock at 9:48 p.m.; its brief also described a typewriter ribbon beside a copy-machine counter.
- **Root cause:** Brief and clue text were not reconciled after story edits.
- **Fix:** Corrected Clockwork’s headcount; moved Blue Hour’s “still present” point to rehearsal’s end; aligned the duplicator/ribbon language; added access-log and recipient-impression facts supporting Celia’s intended solution.
- **Verification:** Manual source/data audit recorded in `CASE_LOGIC_AUDIT.md`; automated reference/solution checks pass.
