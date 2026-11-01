import { describe, expect, it } from 'vitest';
import { cases } from '../data/cases';
import { calculateScore, checkAccusation, validateCaseFile } from './caseEngine';

describe('case content', () => {
  it('includes three complete cases with internally consistent solutions', () => {
    expect(cases).toHaveLength(3);
    for (const caseFile of cases) expect(validateCaseFile(caseFile)).toEqual([]);
  });

  it.each(cases)('$title has a solvable answer supported by collected evidence', (caseFile) => {
    const answer = {
      suspectId: caseFile.answer.culpritId,
      methodEvidenceId: caseFile.answer.methodEvidenceId,
      motiveEvidenceId: caseFile.answer.motiveEvidenceId,
    };
    const evidenceIds = caseFile.evidence.map((evidence) => evidence.id);
    expect(checkAccusation(caseFile, answer, evidenceIds)).toEqual({ kind: 'correct' });
  });
});

describe('accusation rules', () => {
  const caseFile = cases[0];
  const answer = {
    suspectId: caseFile.answer.culpritId,
    methodEvidenceId: caseFile.answer.methodEvidenceId,
    motiveEvidenceId: caseFile.answer.motiveEvidenceId,
  };

  it('does not allow an accusation without all three deductions', () => {
    expect(checkAccusation(caseFile, { ...answer, motiveEvidenceId: '' }, [answer.methodEvidenceId])).toEqual({ kind: 'incomplete' });
  });

  it('requires the selected evidence to have been investigated', () => {
    expect(checkAccusation(caseFile, answer, [answer.methodEvidenceId])).toEqual({ kind: 'uncollected-evidence' });
  });

  it('rejects a suspect or supporting clue that does not match the solution', () => {
    expect(checkAccusation(caseFile, { ...answer, suspectId: 'theo-marr' }, [answer.methodEvidenceId, answer.motiveEvidenceId])).toEqual({ kind: 'incorrect' });
    expect(checkAccusation(caseFile, { ...answer, methodEvidenceId: 'sealed-key' }, [answer.methodEvidenceId, answer.motiveEvidenceId, 'sealed-key'])).toEqual({ kind: 'incorrect' });
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
