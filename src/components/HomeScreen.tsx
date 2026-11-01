import { ArrowDownRight, ArrowRight, BadgeCheck, BookOpenCheck, Check, ChevronRight, Clock3, FileSearch, Shield, Sparkles } from 'lucide-react';
import type { Difficulty, GameProgress } from '../types/game';
import type { Achievement } from '../lib/achievements';
import { cases } from '../data/cases';

interface HomeScreenProps {
  progress: GameProgress;
  achievements: Achievement[];
  onOpenCase: (caseId: string) => void;
  onSetDifficulty: (difficulty: Difficulty) => void;
}

const modes: { id: Difficulty; label: string; note: string }[] = [
  { id: 'story', label: 'Story', note: 'Hints are free' },
  { id: 'standard', label: 'Standard', note: 'A balanced case' },
  { id: 'expert', label: 'Expert', note: 'Fewer points for hints' },
];

export default function HomeScreen({ progress, achievements, onOpenCase, onSetDifficulty }: HomeScreenProps) {
  const solvedCount = Object.keys(progress.results).length;
  const cluesFound = Object.values(progress.cases).reduce((sum, item) => sum + item.discoveredEvidenceIds.length, 0);

  return (
    <main className="page-shell home-screen">
      <section className="intro-hero" aria-labelledby="intro-title">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> Case archive <span className="eyebrow-separator">/</span> Three original mysteries</p>
          <h1 id="intro-title">Read the room.<br /><span>Find the truth.</span></h1>
          <p className="intro-deck">Three cases. A board of evidence. One truth to uncover.</p>
          <div className="intro-actions">
            <a href="#case-files" className="primary-link">Choose a case <ArrowDownRight size={17} /></a>
            <span className="free-note"><Shield size={15} /> Free to play. Your progress stays here.</span>
          </div>
        </div>
        <div className="case-board-art" aria-hidden="true">
          <div className="board-topline"><span>CASE NO. 001</span><span>FIELD NOTES</span></div>
          <div className="board-paper evidence-paper paper-main"><span className="paper-label">ARCHIVE · 21:17</span><span className="paper-mark">◷</span><span className="paper-rule" /><span className="paper-rule short" /></div>
          <div className="board-paper evidence-paper paper-note"><span className="note-quote">“The key was never used.”</span><span className="paper-label">INTERVIEW TRANSCRIPT</span></div>
          <div className="board-paper evidence-paper paper-photo"><div className="photo-window"><span className="window-moon" /><span className="window-line" /></div><span className="paper-label">NORTH ARCHIVE</span></div>
          <svg className="board-threads" viewBox="0 0 430 280" fill="none"><path d="M105 104 C174 115 198 160 262 168" /><path d="M282 116 C253 153 220 200 159 214" /><path d="M105 104 C174 101 232 91 317 78" /></svg>
          <span className="board-pin pin-one" /><span className="board-pin pin-two" /><span className="board-pin pin-three" />
          <span className="board-caption">Nothing is incidental.</span>
        </div>
        <div className="hero-index"><span>01</span><span className="hero-index-rule" /><span>03 CASES</span></div>
      </section>

      <section className="case-intro-row" id="case-files" aria-labelledby="case-files-title">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> The archive</p>
          <h2 id="case-files-title" className="section-heading">Choose a case</h2>
          <p className="section-description">Examine the evidence, hear each account, then make your accusation.</p>
        </div>
        <div className="case-stats" aria-label="Your record">
          <div><strong>{solvedCount.toString().padStart(2, '0')}<span>/{cases.length.toString().padStart(2, '0')}</span></strong><small>CASES CLOSED</small></div>
          <div><strong>{cluesFound.toString().padStart(2, '0')}</strong><small>CLUES LOGGED</small></div>
        </div>
      </section>

      <section className="mode-panel" aria-labelledby="mode-title">
        <div className="mode-copy"><span className="mode-icon"><Sparkles size={15} /></span><div><h3 id="mode-title">Set your approach</h3><p>Choose how much help you want. You can change this between cases.</p></div></div>
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
                <span className="case-card-art" aria-hidden="true"><span className="case-card-symbol">{caseFile.caseNumber === '01' ? '◷' : caseFile.caseNumber === '02' ? '⌁' : '♬'}</span><span className="case-art-rule" /><span className="case-art-index">{caseFile.crime.toUpperCase()}</span></span>
                <span className="case-card-body"><span className="case-card-meta"><span>{caseFile.location}</span><span className="meta-dot" /> <span>{caseFile.complexity}</span></span><span className="case-card-title">{caseFile.title}</span><span className="case-card-subtitle">{caseFile.subtitle}</span><span className="case-card-incident">{caseFile.incident}</span></span>
                <span className="case-card-footer"><span>{result ? <><Check size={14} /> Score {result.score.toLocaleString()}</> : <><BookOpenCheck size={14} /> {cluesFoundForCase}/{caseFile.evidence.length} clues collected</>}</span><ChevronRight size={17} /></span>
              </button>
            </article>
          );
        })}
      </section>

      <section className="bottom-records" aria-label="Detective records">
        <div className="records-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Your record</p><h2 className="section-heading">Good instincts leave a trace.</h2></div><span className="records-count"><FileSearch size={17} /> {achievements.filter((item) => item.unlocked).length} / {achievements.length} earned</span></div>
        <div className="achievement-row">
          {achievements.map((achievement, index) => (
            <article className={`achievement-card ${achievement.unlocked ? 'achievement-earned' : ''}`} key={achievement.id}>
              <span className="achievement-mark" aria-hidden="true">{achievement.unlocked ? <BadgeCheck size={18} /> : <span>{String(index + 1).padStart(2, '0')}</span>}</span>
              <span className="achievement-copy"><strong>{achievement.name}</strong><span>{achievement.description}</span></span>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer"><span>CIPHERCASE <span className="footer-dot">·</span> A SMALL GAME ABOUT PAYING ATTENTION</span><span><Clock3 size={13} /> No account. No server. Just the case.</span><a href="#case-files">Back to the files <ArrowRight size={14} /></a></footer>
    </main>
  );
}
