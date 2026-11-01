import type { CaseActivity, CaseProgress, CaseResult, Difficulty, GameProgress } from '../types/game';
import { cases } from '../data/cases';
import { calculateScore } from './caseEngine';

export const SAVE_KEY = 'ciphercase-progress-v1';
const difficulties: Difficulty[] = ['story', 'standard', 'expert'];

export function createFreshProgress(): GameProgress {
  return { version: 2, difficulty: 'standard', cases: {}, results: {} };
}

export function createCaseProgress(now = new Date().toISOString()): CaseProgress {
  return {
    discoveredEvidenceIds: [],
    interviewedSuspectIds: [],
    discoveredConnectionIds: [],
    boardOrder: [],
    notes: '',
    hintsUsed: 0,
    wrongAccusations: 0,
    openedAt: now,
    activity: [],
    result: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanResult(value: unknown, caseId: string): CaseResult | null {
  if (!isRecord(value)) return null;
  const caseFile = cases.find((item) => item.id === caseId);
  if (!caseFile || typeof value.score !== 'number' || !Number.isFinite(value.score) || value.score < 0 || value.score > 1300) return null;
  if (typeof value.solvedAt !== 'string' || Number.isNaN(Date.parse(value.solvedAt)) || !difficulties.includes(value.difficulty as Difficulty)) return null;
  if (typeof value.hintsUsed !== 'number' || !Number.isInteger(value.hintsUsed) || value.hintsUsed < 0 || value.hintsUsed > caseFile.hints.length) return null;
  if (typeof value.wrongAccusations !== 'number' || !Number.isInteger(value.wrongAccusations) || value.wrongAccusations < 0 || value.wrongAccusations > 100) return null;
  if (value.score !== calculateScore(value.difficulty as Difficulty, value.hintsUsed, value.wrongAccusations)) return null;
  return {
    caseId,
    score: Math.max(0, Math.round(value.score)),
    difficulty: value.difficulty as Difficulty,
    hintsUsed: value.hintsUsed,
    wrongAccusations: value.wrongAccusations,
    solvedAt: value.solvedAt,
  };
}

function cleanIds(value: unknown, allowedIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && allowedIds.has(id)))].slice(0, 100);
}

function cleanActivity(value: unknown): CaseActivity[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CaseActivity => isRecord(item)
    && typeof item.id === 'string'
    && typeof item.at === 'string'
    && typeof item.message === 'string'
    && ['opened', 'evidence', 'interview', 'connection', 'hint', 'accusation', 'solved'].includes(String(item.type)))
    .slice(-40);
}

function cleanCaseProgress(value: unknown, caseId: string): CaseProgress | null {
  if (!isRecord(value)) return null;
  const caseFile = cases.find((item) => item.id === caseId);
  if (!caseFile) return null;
  const result = cleanResult(value.result, caseId);
  const evidenceIds = new Set(caseFile.evidence.map((item) => item.id));
  const suspectIds = new Set(caseFile.suspects.map((item) => item.id));
  const discoveredEvidenceIds = cleanIds(value.discoveredEvidenceIds, evidenceIds);
  const discoveredEvidence = new Set(discoveredEvidenceIds);
  const connectionIds = new Set(caseFile.connections
    .filter((connection) => connection.evidenceIds.every((id) => discoveredEvidence.has(id)))
    .map((connection) => connection.id));
  return {
    discoveredEvidenceIds,
    interviewedSuspectIds: cleanIds(value.interviewedSuspectIds, suspectIds),
    discoveredConnectionIds: cleanIds(value.discoveredConnectionIds, connectionIds),
    boardOrder: cleanIds(value.boardOrder, discoveredEvidence),
    notes: typeof value.notes === 'string' ? value.notes.slice(0, 5000) : '',
    hintsUsed: typeof value.hintsUsed === 'number' ? Math.max(0, Math.min(20, Math.floor(value.hintsUsed))) : 0,
    wrongAccusations: typeof value.wrongAccusations === 'number' ? Math.max(0, Math.min(100, Math.floor(value.wrongAccusations))) : 0,
    openedAt: typeof value.openedAt === 'string' ? value.openedAt : new Date().toISOString(),
    activity: cleanActivity(value.activity),
    result,
  };
}

export function loadProgress(storage?: Pick<Storage, 'getItem'>): GameProgress {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return createFreshProgress();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || (parsed.version !== 1 && parsed.version !== 2)) return createFreshProgress();

    const cases: GameProgress['cases'] = {};
    if (isRecord(parsed.cases)) {
      for (const [caseId, value] of Object.entries(parsed.cases)) {
        const clean = cleanCaseProgress(value, caseId);
        if (clean) cases[caseId] = clean;
      }
    }

    const results: GameProgress['results'] = {};
    if (isRecord(parsed.results)) {
      for (const [caseId, value] of Object.entries(parsed.results)) {
        const clean = cleanResult(value, caseId);
        if (clean) results[caseId] = clean;
      }
    }

    // A result is trusted only when both persisted copies agree. A partial or
    // malformed save cannot independently mark a case solved or unlock awards.
    for (const [caseId, caseProgress] of Object.entries(cases)) {
      const savedResult = results[caseId];
      const caseResult = caseProgress.result;
      const matches = savedResult && caseResult
        && savedResult.score === caseResult.score
        && savedResult.difficulty === caseResult.difficulty
        && savedResult.hintsUsed === caseResult.hintsUsed
        && savedResult.wrongAccusations === caseResult.wrongAccusations
        && savedResult.solvedAt === caseResult.solvedAt;
      if (!matches) caseProgress.result = null;
    }
    for (const caseId of Object.keys(results)) {
      if (!cases[caseId]?.result) delete results[caseId];
    }

    return {
      version: 2,
      difficulty: difficulties.includes(parsed.difficulty as Difficulty) ? parsed.difficulty as Difficulty : 'standard',
      cases,
      results,
    };
  } catch {
    return createFreshProgress();
  }
}

export function saveProgress(progress: GameProgress, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(progress));
    return Boolean(storage);
  } catch {
    return false;
  }
}
