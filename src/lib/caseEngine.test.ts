import { describe, expect, it } from 'vitest';
import { cases } from '../data/cases';
import { calculateScore, checkAccusation, findCaseConnection, validateCaseFile } from './caseEngine';

// Independent test oracle, derived from the authored clue chains in docs/qa/CASE_LOGIC_AUDIT.md.
const solutionOracle: Record<string, { suspectId: string; methodId: string; motiveId: string }> = {
  'clockwork-garden': { suspectId: 'emil-hart', methodId: 'service-hatch', motiveId: 'dealer-letter' },
  'last-platform': { suspectId: 'owen-pike', methodId: 'satchel-seal', motiveId: 'yard-contract' },
  'blue-hour-score': { suspectId: 'celia-ward', methodId: 'blue-copying-ribbon', motiveId: 'publisher-draft' },
};

const connectionOracle: Record<string, Record<string, { evidence: string[]; suspectId?: string }>> = {
  'clockwork-garden': {
    'hidden-route': { evidence: ['service-hatch', 'clay-trace'] },
    'planned-blackout': { evidence: ['fuse-timer', 'clay-trace'] },
    'key-distraction': { evidence: ['sealed-key', 'service-hatch'] },
    'emil-route': { evidence: ['service-hatch'], suspectId: 'emil-hart' },
    'emil-motive': { evidence: ['dealer-letter'], suspectId: 'emil-hart' },
  },
  'last-platform': {
    'satchel-route': { evidence: ['satchel-seal', 'ticket-stub'] },
    'clock-correction': { evidence: ['fast-clock', 'signal-log'] },
    'closure-benefit': { evidence: ['yard-contract', 'satchel-seal'] },
    'owen-route': { evidence: ['satchel-seal'], suspectId: 'owen-pike' },
    'owen-motive': { evidence: ['yard-contract'], suspectId: 'owen-pike' },
  },
  'blue-hour-score': {
    'copy-window': { evidence: ['blue-copying-ribbon', 'ink-drying-time'] },
    'before-lockup': { evidence: ['library-seal', 'ink-drying-time'] },
    'unauthorized-sale': { evidence: ['publisher-draft', 'estate-note'] },
    'celia-method': { evidence: ['blue-copying-ribbon'], suspectId: 'celia-ward' },
    'celia-motive': { evidence: ['publisher-draft'], suspectId: 'celia-ward' },
  },
};

describe('case content and independent solution oracle', () => {
  it('contains three complete cases with valid references', () => {
    expect(cases).toHaveLength(3);
    for (const caseFile of cases) {
      expect(validateCaseFile(caseFile)).toEqual([]);
      expect(caseFile.suspects).toHaveLength(4);
      expect(caseFile.evidence).toHaveLength(5);
      expect(caseFile.hints).toHaveLength(3);
    }
  });

  it.each(cases)('$title agrees with the independently recorded solution', (caseFile) => {
    const expected = solutionOracle[caseFile.id];
    expect(expected, `Missing solution oracle for ${caseFile.id}`).toBeDefined();
    expect(caseFile.answer).toMatchObject({ culpritId: expected.suspectId, methodEvidenceId: expected.methodId, motiveEvidenceId: expected.motiveId });
  });
});

describe('exhaustive accusation matrix', () => {
  it.each(cases)('$title accepts only its single intended complete answer', (caseFile) => {
    const expected = solutionOracle[caseFile.id];
    const discovered = caseFile.evidence.map((item) => item.id);
    let combinations = 0;
    let accepted = 0;

    for (const suspect of caseFile.suspects) {
      for (const method of caseFile.evidence) {
        for (const motive of caseFile.evidence) {
          combinations += 1;
          const outcome = checkAccusation(caseFile, {
            suspectId: suspect.id,
            methodEvidenceId: method.id,
            motiveEvidenceId: motive.id,
          }, discovered);
          const matchesOracle = suspect.id === expected.suspectId
            && method.id === expected.methodId
            && motive.id === expected.motiveId;
          const expectedOutcome = method.id === motive.id ? 'same-evidence' : matchesOracle ? 'correct' : 'incorrect';
          expect(outcome.kind, `${caseFile.id}: ${suspect.id}/${method.id}/${motive.id}`).toBe(expectedOutcome);
          if (outcome.kind === 'correct') accepted += 1;
        }
      }
    }

    expect(combinations).toBe(100);
    expect(accepted).toBe(1);
  });

  it.each(cases)('$title rejects malformed, unavailable and finalized accusations distinctly', (caseFile) => {
    const answer = solutionOracle[caseFile.id];
    const evidenceIds = caseFile.evidence.map((item) => item.id);
    const correctAnswer = { suspectId: answer.suspectId, methodEvidenceId: answer.methodId, motiveEvidenceId: answer.motiveId };
    expect(checkAccusation(caseFile, null, evidenceIds).kind).toBe('invalid-accusation');
    expect(checkAccusation(caseFile, { suspectId: 12, methodEvidenceId: answer.methodId, motiveEvidenceId: answer.motiveId }, evidenceIds).kind).toBe('invalid-accusation');
    expect(checkAccusation(caseFile, { suspectId: '', methodEvidenceId: answer.methodId, motiveEvidenceId: answer.motiveId }, evidenceIds).kind).toBe('incomplete');
    expect(checkAccusation(caseFile, { suspectId: answer.suspectId, methodEvidenceId: '', motiveEvidenceId: answer.motiveId }, evidenceIds).kind).toBe('incomplete');
    expect(checkAccusation(caseFile, { suspectId: answer.suspectId, methodEvidenceId: answer.methodId, motiveEvidenceId: '' }, evidenceIds).kind).toBe('incomplete');
    expect(checkAccusation(caseFile, { suspectId: 'foreign-suspect', methodEvidenceId: answer.methodId, motiveEvidenceId: answer.motiveId }, evidenceIds).kind).toBe('invalid-suspect');
    expect(checkAccusation(caseFile, { suspectId: answer.suspectId, methodEvidenceId: 'foreign-clue', motiveEvidenceId: answer.motiveId }, evidenceIds).kind).toBe('invalid-evidence');
    expect(checkAccusation(caseFile, { suspectId: answer.suspectId, methodEvidenceId: answer.methodId, motiveEvidenceId: answer.methodId }, evidenceIds).kind).toBe('same-evidence');
    expect(checkAccusation(caseFile, correctAnswer, [answer.methodId]).kind).toBe('uncollected-evidence');
    expect(checkAccusation(caseFile, correctAnswer, evidenceIds, true).kind).toBe('already-solved');
  });
});

describe('deduction connection matrix', () => {
  it.each(cases)('$title exposes only configured evidence and suspect connections', (caseFile) => {
    const oracle = connectionOracle[caseFile.id];
    const evidenceIds = caseFile.evidence.map((item) => item.id);
    const suspectIds = caseFile.suspects.map((item) => item.id);
    expect(Object.keys(oracle).sort()).toEqual(caseFile.connections.map((item) => item.id).sort());

    for (const connection of caseFile.connections) {
      const expected = oracle[connection.id];
      expect(expected).toBeDefined();
      expect(new Set(connection.evidenceIds)).toEqual(new Set(expected.evidence));
      expect(connection.suspectId).toBe(expected.suspectId);
      const forward = findCaseConnection(caseFile.connections, expected.evidence, expected.suspectId, evidenceIds, suspectIds);
      expect(forward?.id).toBe(connection.id);
      if (!expected.suspectId) {
        expect(findCaseConnection(caseFile.connections, [...expected.evidence].reverse(), undefined, evidenceIds, suspectIds)?.id).toBe(connection.id);
      }
    }

    for (let first = 0; first < evidenceIds.length; first += 1) {
      for (let second = first; second < evidenceIds.length; second += 1) {
        const pair = first === second ? [evidenceIds[first], evidenceIds[second]] : [evidenceIds[first], evidenceIds[second]];
        const expected = caseFile.connections.find((connection) => !connection.suspectId
          && connection.evidenceIds.length === 2
          && connection.evidenceIds.every((id) => pair.includes(id)));
        expect(findCaseConnection(caseFile.connections, pair, undefined, evidenceIds, suspectIds)?.id).toBe(expected?.id);
      }
    }

    for (const evidenceId of evidenceIds) {
      for (const suspectId of suspectIds) {
        const expected = caseFile.connections.find((connection) => connection.suspectId === suspectId && connection.evidenceIds[0] === evidenceId);
        expect(findCaseConnection(caseFile.connections, [evidenceId], suspectId, evidenceIds, suspectIds)?.id).toBe(expected?.id);
      }
    }

    expect(findCaseConnection(caseFile.connections, [evidenceIds[0], evidenceIds[1]], undefined, [evidenceIds[0]], suspectIds)).toBeUndefined();
    expect(findCaseConnection(caseFile.connections, ['foreign-clue', evidenceIds[0]], undefined, evidenceIds, suspectIds)).toBeUndefined();
    expect(findCaseConnection(caseFile.connections, [evidenceIds[0]], 'foreign-suspect', evidenceIds, suspectIds)).toBeUndefined();
    expect(findCaseConnection(caseFile.connections, [evidenceIds[0], evidenceIds[0]], undefined, evidenceIds, suspectIds)).toBeUndefined();
  });
});

describe('score calculation', () => {
  it('charges for hints and wrong accusations according to the selected mode', () => {
    expect(calculateScore('story', 2, 1)).toBe(875);
    expect(calculateScore('standard', 1, 1)).toBe(914);
    expect(calculateScore('expert', 1, 1)).toBe(956);
  });

  it('keeps the score at a minimum of 100', () => {
    expect(calculateScore('expert', 20, 10)).toBe(100);
  });
});
