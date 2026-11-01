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
    expect(progress.soundEnabled).toBe(false);
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
      discoveredConnectionIds: ['satchel-route'],
      boardOrder: ['ticket-stub', 'satchel-seal'],
    };
    fresh.soundEnabled = true;
    expect(saveProgress(fresh, storage)).toBe(true);
    const restored = loadProgress(storage);
    expect(restored.cases['last-platform'].discoveredConnectionIds).toEqual(['satchel-route']);
    expect(restored.cases['last-platform'].boardOrder).toEqual(['ticket-stub', 'satchel-seal']);
    expect(restored.soundEnabled).toBe(true);
  });
});
