import type { CaseFile, Difficulty } from '../types/game';

export type AccusationCheck =
  | { kind: 'correct' }
  | { kind: 'incomplete' }
  | { kind: 'invalid-accusation' }
  | { kind: 'invalid-suspect' }
  | { kind: 'invalid-evidence' }
  | { kind: 'same-evidence' }
  | { kind: 'already-solved' }
  | { kind: 'uncollected-evidence' }
  | { kind: 'incorrect' };

const hintPenalty: Record<Difficulty, number> = {
  story: 0,
  standard: 80,
  expert: 140,
};

const difficultyMultiplier: Record<Difficulty, number> = {
  story: 1,
  standard: 1.15,
  expert: 1.3,
};

export function validateCaseFile(caseFile: CaseFile): string[] {
  const errors: string[] = [];
  const suspectIds = caseFile.suspects.map((suspect) => suspect.id);
  const evidenceIds = caseFile.evidence.map((evidence) => evidence.id);
  const uniqueSuspects = new Set(suspectIds);
  const uniqueEvidence = new Set(evidenceIds);

  if (!caseFile.id || !caseFile.title) errors.push('Case id and title are required.');
  if (uniqueSuspects.size !== suspectIds.length) errors.push('Suspect ids must be unique.');
  if (uniqueEvidence.size !== evidenceIds.length) errors.push('Evidence ids must be unique.');
  if (!uniqueSuspects.has(caseFile.answer.culpritId)) errors.push('The solution must name a suspect in the case.');
  if (!uniqueEvidence.has(caseFile.answer.methodEvidenceId)) errors.push('The method clue must belong to this case.');
  if (!uniqueEvidence.has(caseFile.answer.motiveEvidenceId)) errors.push('The motive clue must belong to this case.');
  if (caseFile.answer.methodEvidenceId === caseFile.answer.motiveEvidenceId) errors.push('Method and motive require separate clues.');
  if (caseFile.suspects.length < 3) errors.push('A case must have at least three suspects.');
  if (caseFile.evidence.length < 4) errors.push('A case must have at least four evidence items.');
  if (caseFile.hints.length < 2) errors.push('A case must include contextual hints.');

  const allEvidenceIds = new Set(evidenceIds);
  for (const hint of caseFile.hints) {
    if (hint.evidenceIds.some((id) => !allEvidenceIds.has(id))) {
      errors.push('Every hint reference must point to evidence in the case.');
      break;
    }
  }

  for (const entry of caseFile.timeline) {
    if (entry.evidenceIds?.some((id) => !allEvidenceIds.has(id))) {
      errors.push('Every timeline reference must point to evidence in the case.');
      break;
    }
  }

  const uniqueConnectionIds = new Set<string>();
  for (const connection of caseFile.connections ?? []) {
    if (!connection.id || uniqueConnectionIds.has(connection.id)) errors.push('Case connection ids must be present and unique.');
    uniqueConnectionIds.add(connection.id);
    if (!connection.insight.trim()) errors.push('Every case connection must include an insight.');
    if (connection.evidenceIds.some((id) => !allEvidenceIds.has(id))) errors.push('Every case connection must reference evidence in the case.');
    if (new Set(connection.evidenceIds).size !== connection.evidenceIds.length) errors.push('A connection cannot repeat an evidence item.');
    if (connection.suspectId && !uniqueSuspects.has(connection.suspectId)) errors.push('Every person connection must reference a suspect in the case.');
    if (connection.evidenceIds.length === 2 && connection.suspectId) errors.push('A connection must compare two clues or one clue and one suspect.');
    if (connection.evidenceIds.length !== 2 && !(connection.evidenceIds.length === 1 && connection.suspectId)) errors.push('A connection must compare two clues or one clue and one suspect.');
  }

  return errors;
}

export function checkAccusation(
  caseFile: CaseFile,
  accusation: unknown,
  discoveredEvidenceIds: readonly string[],
  alreadySolved = false,
): AccusationCheck {
  if (alreadySolved) return { kind: 'already-solved' };
  if (typeof accusation !== 'object' || accusation === null || Array.isArray(accusation)) {
    return { kind: 'invalid-accusation' };
  }
  const record = accusation as Record<string, unknown>;
  const { suspectId, methodEvidenceId, motiveEvidenceId } = record;
  if (suspectId === undefined || methodEvidenceId === undefined || motiveEvidenceId === undefined) {
    return { kind: 'incomplete' };
  }
  if (typeof suspectId !== 'string' || typeof methodEvidenceId !== 'string' || typeof motiveEvidenceId !== 'string') return { kind: 'invalid-accusation' };
  if (!suspectId || !methodEvidenceId || !motiveEvidenceId) return { kind: 'incomplete' };

  if (!caseFile.suspects.some((suspect) => suspect.id === suspectId)) return { kind: 'invalid-suspect' };
  const evidenceIds = new Set(caseFile.evidence.map((evidence) => evidence.id));
  if (!evidenceIds.has(methodEvidenceId) || !evidenceIds.has(motiveEvidenceId)) return { kind: 'invalid-evidence' };
  if (methodEvidenceId === motiveEvidenceId) return { kind: 'same-evidence' };

  const discovered = new Set(discoveredEvidenceIds);
  if (!discovered.has(methodEvidenceId) || !discovered.has(motiveEvidenceId)) {
    return { kind: 'uncollected-evidence' };
  }

  const isCorrect = suspectId === caseFile.answer.culpritId
    && methodEvidenceId === caseFile.answer.methodEvidenceId
    && motiveEvidenceId === caseFile.answer.motiveEvidenceId;

  return isCorrect ? { kind: 'correct' } : { kind: 'incorrect' };
}

export function findCaseConnection(
  connections: CaseFile['connections'],
  evidenceIds: readonly string[],
  suspectId: string | undefined,
  availableEvidenceIds: readonly string[],
  availableSuspectIds: readonly string[],
): CaseFile['connections'][number] | undefined {
  const evidenceSet = new Set(availableEvidenceIds);
  const suspectSet = new Set(availableSuspectIds);
  if (evidenceIds.some((id) => !evidenceSet.has(id))) return undefined;
  if (new Set(evidenceIds).size !== evidenceIds.length) return undefined;

  if (suspectId !== undefined) {
    if (evidenceIds.length !== 1 || !suspectSet.has(suspectId)) return undefined;
    return connections.find((connection) => connection.suspectId === suspectId
      && connection.evidenceIds.length === 1
      && connection.evidenceIds[0] === evidenceIds[0]);
  }

  if (evidenceIds.length !== 2) return undefined;
  return connections.find((connection) => connection.suspectId === undefined
    && connection.evidenceIds.length === 2
    && connection.evidenceIds.every((id) => evidenceIds.includes(id)));
}

export function calculateScore(
  difficulty: Difficulty,
  hintsUsed: number,
  wrongAccusations: number,
): number {
  const deductions = (hintsUsed * hintPenalty[difficulty]) + (wrongAccusations * 125);
  return Math.max(100, Math.round(Math.max(0, 1000 - deductions) * difficultyMultiplier[difficulty]));
}

export function getHintCost(difficulty: Difficulty): number {
  return hintPenalty[difficulty];
}
