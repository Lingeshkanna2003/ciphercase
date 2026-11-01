import { describe, expect, it } from 'vitest';
import { cases } from '../data/cases';
import { createShareUrl, readSharedResult } from './sharing';

describe('shared result links', () => {
  it('round-trips a valid score while retaining the static-site path', () => {
    const result = { caseId: 'clockwork-garden', score: 1150, difficulty: 'standard' as const, hintsUsed: 0, solvedAt: '2026-10-01T12:00:00.000Z' };
    const url = createShareUrl(result, 'https://example.test/ciphercase/?old=1#home');
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/ciphercase/');
    expect(parsed.hash).toBe('');
    expect(readSharedResult(parsed.search, cases)).toMatchObject(result);
  });

  it.each([
    '?share=not-base64-json',
    `?share=${btoa(JSON.stringify({ caseId: 'missing', score: 1000, difficulty: 'standard', solvedAt: '2026-01-01' }))}`,
    `?share=${btoa(JSON.stringify({ caseId: 'clockwork-garden', score: 99999, difficulty: 'standard', solvedAt: '2026-01-01' }))}`,
    `?share=${btoa(JSON.stringify({ caseId: 'clockwork-garden', score: 0, difficulty: 'standard', hintsUsed: 0, solvedAt: '2026-01-01' }))}`,
    `?share=${btoa(JSON.stringify({ caseId: 'clockwork-garden', score: 1000, difficulty: 'impossible', solvedAt: '2026-01-01' }))}`,
    `?share=${btoa(JSON.stringify({ caseId: 'clockwork-garden', score: 1000, difficulty: 'standard', hintsUsed: 4, solvedAt: '2026-01-01' }))}`,
  ])('rejects malformed shared payload %s', (search) => {
    expect(readSharedResult(search, cases)).toBeNull();
  });
});
