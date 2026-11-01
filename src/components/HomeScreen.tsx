import { ArrowDownRight, BadgeCheck, BookOpenCheck, Check, ChevronRight } from 'lucide-react';
import type { Difficulty, GameProgress } from '../types/game';
import { cases } from '../data/cases';
import CaseEnvironment from './CaseEnvironment';

interface HomeScreenProps {
  progress: GameProgress;
  onOpenCase: (caseId: string) => void;
  onSetDifficulty: (difficulty: Difficulty) => void;
}

const modes: { id: Difficulty; label: string; note: string }[] = [
  { id: 'story', label: 'Story', note: 'Hints are free' },
  { id: 'standard', label: 'Standard', note: 'A balanced case' },
  { id: 'expert', label: 'Expert', note: 'Fewer points for hints' },
];

export default function HomeScreen({ progress, onOpenCase, onSetDifficulty }: HomeScreenProps) {
  const solvedCount = Object.keys(progress.results).length;
  const cluesFound = Object.values(progress.cases).reduce((sum, item) => sum + item.discoveredEvidenceIds.length, 0);

  return (
    <main className="page-shell home-screen">
      <section className="intro-hero" aria-labelledby="intro-title">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> Three original cases</p>
          <h1 id="intro-title">Read the clues.<br /><span>Find the truth.</span></h1>
          <p className="intro-deck">Study the evidence, question the suspects, and decide what happened.</p>
          <div className="intro-actions">
            <a href="#case-files" className="primary-link">Choose a case <ArrowDownRight size={17} /></a>
          </div>
        </div>
        <div className="case-board-art" aria-hidden="true">
          <CaseEnvironment caseId="clockwork-garden" compact eager />
          <div className="hero-image-caption"><span>CASE 01</span><strong>The Clockwork Garden</strong></div>
        </div>
      </section>

      <section className="case-intro-row" id="case-files" aria-labelledby="case-files-title">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> The archive</p>
          <h2 id="case-files-title" className="section-heading">Choose a case</h2>
          <p className="section-description">Examine evidence. Interview suspects. Make your accusation.</p>
        </div>
        <div className="case-stats" aria-label="Your record">
          <div><strong>{solvedCount.toString().padStart(2, '0')}<span>/{cases.length.toString().padStart(2, '0')}</span></strong><small>CASES CLOSED</small></div>
          <div><strong>{cluesFound.toString().padStart(2, '0')}</strong><small>CLUES LOGGED</small></div>
        </div>
      </section>

      <section className="mode-panel" aria-labelledby="mode-title">
        <div className="mode-copy"><div><h3 id="mode-title">Difficulty</h3><p>Choose how much help you want.</p></div></div>
        <div className="mode-picker" role="group" aria-label="Select difficulty">
          {modes.map((mode) => (
            <button key={mode.id} type="button" className={`mode-option ${progress.difficulty === mode.id ? 'selected' : ''}`} aria-pressed={progress.difficulty === mode.id} onClick={() => onSetDifficulty(mode.id)}>
              <span className="mode-option-label">{progress.difficulty === mode.id && <Check size={13} />}{mode.label}</span><span className="mode-option-note">{mode.note}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="case-grid" aria-label="Available cases">
        {cases.map((caseFile) => {
          const caseProgress = progress.cases[caseFile.id];
          const result = progress.results[caseFile.id];
          const cluesFoundForCase = caseProgress?.discoveredEvidenceIds.length ?? 0;
          return (
            <article className={`case-card ${result ? 'case-card-solved' : ''}`} key={caseFile.id}>
              <button className="case-card-open" type="button" onClick={() => onOpenCase(caseFile.id)} aria-label={`${result ? 'Review solved case' : 'Open case'} ${caseFile.caseNumber}: ${caseFile.title}`}>
                <div className="case-card-top"><span className="case-number">FILE <b>{caseFile.caseNumber}</b></span><span className={`case-status ${result ? 'status-solved' : ''}`}>{result ? <><BadgeCheck size={13} /> Solved</> : 'Open file'}</span></div>
                <span className="case-card-art"><CaseEnvironment caseId={caseFile.id} compact /><span className="case-art-index">{caseFile.crime.toUpperCase()}</span></span>
                <span className="case-card-body"><span className="case-card-meta"><span>{caseFile.location}</span><span className="meta-dot" /> <span>{caseFile.complexity}</span></span><span className="case-card-title">{caseFile.title}</span><span className="case-card-incident">{caseFile.incident}</span></span>
                <span className="case-card-footer"><span>{result ? <><Check size={14} /> Score {result.score.toLocaleString()}</> : <><BookOpenCheck size={14} /> {cluesFoundForCase}/{caseFile.evidence.length} clues collected</>}</span><span className="case-cta">{result ? 'Reopen file' : cluesFoundForCase ? 'Continue case' : 'Open file'} <ChevronRight size={17} /></span></span>
              </button>
            </article>
          );
        })}
      </section>

    </main>
  );
}
