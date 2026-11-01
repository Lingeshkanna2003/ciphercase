import { describe, expect, it } from 'vitest';
import { createCaseProgress, createFreshProgress, loadProgress, saveProgress } from './progress';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('local progress migration', () => {
  it('upgrades version 1 saves without discarding notes or investigated clues', () => {
    const storage = new MemoryStorage();
    storage.setItem('ciphercase-progress-v1', JSON.stringify({
      version: 1,
      difficulty: 'expert',
      cases: { 'clockwork-garden': { ...createCaseProgress('2026-01-01'), discoveredEvidenceIds: ['service-hatch'], notes: 'Check the north wall.' } },
      results: {},
    }));

    const progress = loadProgress(storage);
    expect(progress.version).toBe(2);
    expect(progress.difficulty).toBe('expert');
    expect(progress.cases['clockwork-garden'].discoveredEvidenceIds).toEqual(['service-hatch']);
    expect(progress.cases['clockwork-garden'].notes).toBe('Check the north wall.');
    expect(progress.cases['clockwork-garden'].discoveredConnectionIds).toEqual([]);
    expect(progress.cases['clockwork-garden'].boardOrder).toEqual([]);
  });

  it('saves deduction board connections and custom clue order', () => {
    const storage = new MemoryStorage();
    const fresh = createFreshProgress();
    fresh.cases['last-platform'] = {
      ...createCaseProgress(),
      discoveredEvidenceIds: ['ticket-stub', 'satchel-seal'],
      discoveredConnectionIds: ['satchel-route'],
      boardOrder: ['ticket-stub', 'satchel-seal'],
    };
    expect(saveProgress(fresh, storage)).toBe(true);
    const restored = loadProgress(storage);
    expect(restored.cases['last-platform'].discoveredConnectionIds).toEqual(['satchel-route']);
    expect(restored.cases['last-platform'].boardOrder).toEqual(['ticket-stub', 'satchel-seal']);
  });

  it('drops unknown and duplicate ids from saved case state', () => {
    const storage = new MemoryStorage();
    const caseProgress = {
      ...createCaseProgress(),
      discoveredEvidenceIds: ['service-hatch', 'service-hatch', 'foreign-clue'],
      interviewedSuspectIds: ['emil-hart', 'foreign-suspect'],
      discoveredConnectionIds: ['emil-route', 'foreign-connection', 'emil-route'],
      boardOrder: ['service-hatch', 'foreign-clue', 'service-hatch'],
    };
    storage.setItem('ciphercase-progress-v1', JSON.stringify({
      version: 2,
      difficulty: 'standard',
      cases: { 'clockwork-garden': caseProgress, 'unknown-case': caseProgress },
      results: {},
    }));

    const restored = loadProgress(storage);
    expect(Object.keys(restored.cases)).toEqual(['clockwork-garden']);
    expect(restored.cases['clockwork-garden'].discoveredEvidenceIds).toEqual(['service-hatch']);
    expect(restored.cases['clockwork-garden'].interviewedSuspectIds).toEqual(['emil-hart']);
    expect(restored.cases['clockwork-garden'].discoveredConnectionIds).toEqual(['emil-route']);
    expect(restored.cases['clockwork-garden'].boardOrder).toEqual(['service-hatch']);
  });

  it('does not trust a solved flag stored in only one copy of the result', () => {
    const storage = new MemoryStorage();
    const result = { caseId: 'clockwork-garden', score: 1000, difficulty: 'standard', hintsUsed: 0, wrongAccusations: 0, solvedAt: '2026-01-01T00:00:00.000Z' };
    storage.setItem('ciphercase-progress-v1', JSON.stringify({
      version: 2,
      difficulty: 'standard',
      cases: { 'clockwork-garden': { ...createCaseProgress(), result } },
      results: {},
    }));

    const restored = loadProgress(storage);
    expect(restored.cases['clockwork-garden'].result).toBeNull();
    expect(restored.results).toEqual({});
  });
});
