import type { CaseActivity, CaseProgress, CaseResult, Difficulty, GameProgress } from '../types/game';

export const SAVE_KEY = 'ciphercase-progress-v1';
const difficulties: Difficulty[] = ['story', 'standard', 'expert'];

export function createFreshProgress(): GameProgress {
  return { version: 2, difficulty: 'standard', soundEnabled: false, cases: {}, results: {} };
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
  if (typeof value.score !== 'number' || !Number.isFinite(value.score)) return null;
  if (typeof value.solvedAt !== 'string' || !difficulties.includes(value.difficulty as Difficulty)) return null;
  return {
    caseId,
    score: Math.max(0, Math.round(value.score)),
    difficulty: value.difficulty as Difficulty,
    hintsUsed: typeof value.hintsUsed === 'number' ? Math.max(0, value.hintsUsed) : 0,
    wrongAccusations: typeof value.wrongAccusations === 'number' ? Math.max(0, value.wrongAccusations) : 0,
    solvedAt: value.solvedAt,
  };
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
  const result = cleanResult(value.result, caseId);
  return {
    discoveredEvidenceIds: Array.isArray(value.discoveredEvidenceIds)
      ? value.discoveredEvidenceIds.filter((id): id is string => typeof id === 'string').slice(0, 100)
      : [],
    interviewedSuspectIds: Array.isArray(value.interviewedSuspectIds)
      ? value.interviewedSuspectIds.filter((id): id is string => typeof id === 'string').slice(0, 100)
      : [],
    discoveredConnectionIds: Array.isArray(value.discoveredConnectionIds)
      ? value.discoveredConnectionIds.filter((id): id is string => typeof id === 'string').slice(0, 100)
      : [],
    boardOrder: Array.isArray(value.boardOrder)
      ? value.boardOrder.filter((id): id is string => typeof id === 'string').slice(0, 100)
      : [],
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

    return {
      version: 2,
      difficulty: difficulties.includes(parsed.difficulty as Difficulty) ? parsed.difficulty as Difficulty : 'standard',
      soundEnabled: parsed.soundEnabled === true,
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
