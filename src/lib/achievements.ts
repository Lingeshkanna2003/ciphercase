import type { GameProgress } from '../types/game';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export function getAchievements(progress: GameProgress, totalCases: number): Achievement[] {
  const results = Object.values(progress.results);
  const discovered = Object.values(progress.cases).some((caseProgress) => caseProgress.discoveredEvidenceIds.length > 0);
  return [
    { id: 'first-clue', name: 'First lead', description: 'Examine your first piece of evidence.', unlocked: discovered },
    { id: 'first-solution', name: 'Case closed', description: 'Solve your first mystery.', unlocked: results.length > 0 },
    { id: 'no-hints', name: 'Read between the lines', description: 'Solve a case without asking for a hint.', unlocked: results.some((result) => result.hintsUsed === 0) },
    { id: 'clean-close', name: 'A steady hand', description: 'Solve a case without a wrong accusation.', unlocked: results.some((result) => result.wrongAccusations === 0) },
    { id: 'all-cases', name: 'The whole story', description: 'Solve all available cases.', unlocked: totalCases > 0 && results.length >= totalCases },
  ];
}
