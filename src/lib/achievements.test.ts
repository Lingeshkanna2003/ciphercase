import { describe, expect, it } from 'vitest';
import { createFreshProgress, createCaseProgress } from './progress';
import { getAchievements } from './achievements';

describe('achievement requirements', () => {
  it('unlocks the clue award only after examining evidence', () => {
    const progress = createFreshProgress();
    expect(getAchievements(progress, 3).find((item) => item.id === 'first-clue')?.unlocked).toBe(false);
    progress.cases['clockwork-garden'] = { ...createCaseProgress(), discoveredEvidenceIds: ['service-hatch'] };
    expect(getAchievements(progress, 3).find((item) => item.id === 'first-clue')?.unlocked).toBe(true);
  });

  it('unlocks solution awards from unique saved results only', () => {
    const progress = createFreshProgress();
    const result = { caseId: 'clockwork-garden', score: 1000, difficulty: 'story' as const, hintsUsed: 0, wrongAccusations: 0, solvedAt: '2026-01-01T00:00:00.000Z' };
    progress.results['clockwork-garden'] = result;
    const achievements = getAchievements(progress, 3);
    expect(achievements.find((item) => item.id === 'first-solution')?.unlocked).toBe(true);
    expect(achievements.find((item) => item.id === 'no-hints')?.unlocked).toBe(true);
    expect(achievements.find((item) => item.id === 'clean-close')?.unlocked).toBe(true);
    expect(achievements.find((item) => item.id === 'all-cases')?.unlocked).toBe(false);
    progress.results['last-platform'] = { ...result, caseId: 'last-platform', hintsUsed: 1, wrongAccusations: 1 };
    progress.results['blue-hour-score'] = { ...result, caseId: 'blue-hour-score', hintsUsed: 1, wrongAccusations: 1 };
    expect(getAchievements(progress, 3).find((item) => item.id === 'all-cases')?.unlocked).toBe(true);
  });
});
