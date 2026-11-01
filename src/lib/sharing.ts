import type { CaseFile, Difficulty, SharedResult } from '../types/game';

const difficulties: Difficulty[] = ['story', 'standard', 'expert'];

export function createShareUrl(result: SharedResult, href: string): string {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  const payload = btoa(JSON.stringify(result));
  url.searchParams.set('share', payload);
  return url.toString();
}

export function readSharedResult(search: string, cases: CaseFile[]): SharedResult | null {
  try {
    const encoded = new URLSearchParams(search).get('share');
    if (!encoded) return null;
    const value: unknown = JSON.parse(atob(encoded));
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    const caseFile = cases.find((item) => item.id === record.caseId);
    if (!caseFile) return null;
    if (typeof record.score !== 'number' || !Number.isInteger(record.score) || record.score < 100 || record.score > 1300) return null;
    if (!difficulties.includes(record.difficulty as Difficulty)) return null;
    if (typeof record.solvedAt !== 'string' || Number.isNaN(Date.parse(record.solvedAt))) return null;
    if (typeof record.hintsUsed !== 'number' || !Number.isInteger(record.hintsUsed) || record.hintsUsed < 0 || record.hintsUsed > caseFile.hints.length) return null;
    return {
      caseId: record.caseId as string,
      score: record.score,
      difficulty: record.difficulty as Difficulty,
      hintsUsed: record.hintsUsed,
      solvedAt: record.solvedAt,
    };
  } catch {
    return null;
  }
}
