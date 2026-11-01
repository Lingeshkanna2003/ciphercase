import clockworkGarden from './clockwork-garden.json';
import lastPlatform from './last-platform.json';
import blueHourScore from './blue-hour-score.json';
import type { CaseFile } from '../../types/game';

export const cases = [clockworkGarden, lastPlatform, blueHourScore] as CaseFile[];

export function getCaseById(caseId: string): CaseFile | undefined {
  return cases.find((caseFile) => caseFile.id === caseId);
}
