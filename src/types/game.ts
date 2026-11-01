export type Difficulty = 'story' | 'standard' | 'expert';

export type CaseActivityType = 'opened' | 'evidence' | 'interview' | 'connection' | 'hint' | 'accusation' | 'solved';

export interface Suspect {
  id: string;
  name: string;
  role: string;
  initials: string;
  profile: string;
  motive: string;
  alibi: string;
  detail: string;
}

export interface Evidence {
  id: string;
  title: string;
  kind: string;
  location: string;
  teaser: string;
  observation: string;
  meaning: string;
  icon: string;
}

export interface CaseTimelineEntry {
  time: string;
  label: string;
  detail: string;
  evidenceIds?: string[];
}

export interface CaseHint {
  text: string;
  evidenceIds: string[];
}

export interface CaseConnection {
  id: string;
  evidenceIds: string[];
  suspectId?: string;
  insight: string;
}

export interface CaseFile {
  id: string;
  caseNumber: string;
  title: string;
  subtitle: string;
  location: string;
  incident: string;
  brief: string;
  victim: string;
  crime: string;
  complexity: string;
  estimatedMinutes: number;
  suspects: Suspect[];
  evidence: Evidence[];
  timeline: CaseTimelineEntry[];
  hints: CaseHint[];
  connections: CaseConnection[];
  answer: {
    culpritId: string;
    methodEvidenceId: string;
    motiveEvidenceId: string;
    revealTitle: string;
    reveal: string;
  };
}

export interface Accusation {
  suspectId: string;
  methodEvidenceId: string;
  motiveEvidenceId: string;
}

export interface CaseResult {
  caseId: string;
  score: number;
  difficulty: Difficulty;
  hintsUsed: number;
  wrongAccusations: number;
  solvedAt: string;
}

export interface CaseActivity {
  id: string;
  at: string;
  type: CaseActivityType;
  message: string;
}

export interface CaseProgress {
  discoveredEvidenceIds: string[];
  interviewedSuspectIds: string[];
  discoveredConnectionIds: string[];
  boardOrder: string[];
  notes: string;
  hintsUsed: number;
  wrongAccusations: number;
  openedAt: string;
  activity: CaseActivity[];
  result: CaseResult | null;
}

export interface GameProgress {
  version: 2;
  difficulty: Difficulty;
  soundEnabled: boolean;
  cases: Record<string, CaseProgress>;
  results: Record<string, CaseResult>;
}

export interface SharedResult {
  caseId: string;
  score: number;
  difficulty: Difficulty;
  hintsUsed: number;
  solvedAt: string;
}
