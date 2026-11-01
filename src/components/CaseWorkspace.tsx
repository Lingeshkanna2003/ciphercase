import { useState } from 'react';
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, BookOpen, Check, CheckCircle2, Clock3,
  DoorOpen, FileText, Fingerprint, Footprints, KeyRound, Lightbulb, MapPin,
  NotebookPen, Search, ShieldCheck, Ticket, UserRound, X,
} from 'lucide-react';
import type { Accusation, CaseFile, CaseProgress, Difficulty, Evidence, Suspect } from '../types/game';
import { getHintCost } from '../lib/caseEngine';

interface CaseWorkspaceProps {
  caseFile: CaseFile;
  progress: CaseProgress;
  difficulty: Difficulty;
  feedback: string;
  onBack: () => void;
  onExamine: (evidenceId: string) => void;
  onInterview: (suspectId: string) => void;
  onNoteChange: (note: string) => void;
  onHint: () => void;
  onAccuse: (accusation: Accusation) => void;
  onShare: () => void;
}

const evidenceIcons = {
  door: DoorOpen,
  file: FileText,
  clock: Clock3,
  key: KeyRound,
  footprints: Footprints,
  fingerprint: Fingerprint,
  ticket: Ticket,
} as const;

function EvidenceGlyph({ evidence }: { evidence: Evidence }) {
  const Icon = evidenceIcons[evidence.icon as keyof typeof evidenceIcons] ?? Search;
  return <Icon size={17} strokeWidth={1.7} aria-hidden="true" />;
}

function formatActivityTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

function EvidenceCard({ evidence, discovered, selected, hinted, onExamine }: {
  evidence: Evidence;
  discovered: boolean;
  selected: boolean;
  hinted: boolean;
  onExamine: () => void;
}) {
  return (
    <article className={`evidence-card ${discovered ? 'evidence-found' : ''} ${selected ? 'evidence-selected' : ''} ${hinted ? 'evidence-hinted' : ''}`}>
      <div className="evidence-card-top"><span className="evidence-icon"><EvidenceGlyph evidence={evidence} /></span><span className="evidence-kind">{evidence.kind}</span>{discovered && <CheckCircle2 className="evidence-check" size={15} aria-label="Collected" />}</div>
      <h4>{evidence.title}</h4>
      <p className="evidence-location"><MapPin size={12} /> {evidence.location}</p>
      <p className="evidence-teaser">{evidence.teaser}</p>
      <button type="button" className="text-action evidence-action" aria-pressed={selected} onClick={onExamine}>
        {discovered ? 'Review evidence' : 'Examine evidence'} <ArrowUpRight size={14} />
      </button>
      {hinted && <span className="hint-marker"><Lightbulb size={12} /> Hint points here</span>}
    </article>
  );
}

function SuspectCard({ suspect, selected, interviewed, onSelect, onInterview }: {
  suspect: Suspect;
  selected: boolean;
  interviewed: boolean;
  onSelect: () => void;
  onInterview: () => void;
}) {
  return (
    <article className={`suspect-card ${selected ? 'suspect-selected' : ''}`}>
      <button type="button" className="suspect-select" aria-pressed={selected} onClick={onSelect}>
        <span className="suspect-monogram" aria-hidden="true">{suspect.initials}</span>
        <span className="suspect-main"><strong>{suspect.name}</strong><span>{suspect.role}</span></span>
        <span className="suspect-select-mark">{selected ? <Check size={15} /> : <span className="radio-empty" />}</span>
      </button>
      <details className="suspect-details">
        <summary><UserRound size={13} /> Open profile</summary>
        <div className="suspect-profile">
          <p>{suspect.profile}</p>
          <dl><div><dt>Possible motive</dt><dd>{suspect.motive}</dd></div><div><dt>Account of the night</dt><dd>{suspect.alibi}</dd></div><div><dt>In the file</dt><dd>{suspect.detail}</dd></div></dl>
          <button type="button" className="small-outline-button" onClick={onInterview} disabled={interviewed}>
            {interviewed ? <><Check size={13} /> Interview logged</> : <>Log this interview <ArrowUpRight size={13} /></>}
          </button>
        </div>
      </details>
    </article>
  );
}

function SolutionPanel({ caseFile, score, onShare, onBack }: { caseFile: CaseFile; score: number; onShare: () => void; onBack: () => void }) {
  return (
    <section className="solution-panel" aria-labelledby="solution-title">
      <div className="solution-stamp"><BadgeCheck size={18} /> Case closed</div>
      <div className="solution-copy"><p className="eyebrow">The reconstruction</p><h2 id="solution-title">{caseFile.answer.revealTitle}</h2><p>{caseFile.answer.reveal}</p></div>
      <div className="solution-result"><span className="score-label">DEDUCTION SCORE</span><strong>{score.toLocaleString()}<small> pts</small></strong><span>Recorded on this device</span></div>
      <div className="solution-actions"><button type="button" className="primary-button" onClick={onShare}>Share result <ArrowUpRight size={16} /></button><button type="button" className="quiet-button" onClick={onBack}>Return to case files</button></div>
    </section>
  );
}

export default function CaseWorkspace({ caseFile, progress, difficulty, feedback, onBack, onExamine, onInterview, onNoteChange, onHint, onAccuse, onShare }: CaseWorkspaceProps) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(progress.discoveredEvidenceIds[0] ?? null);
  const [selectedSuspectId, setSelectedSuspectId] = useState('');
  const [methodEvidenceId, setMethodEvidenceId] = useState('');
  const [motiveEvidenceId, setMotiveEvidenceId] = useState('');
  const isSolved = Boolean(progress.result);
  const discovered = new Set(progress.discoveredEvidenceIds);
  const collectedEvidence = caseFile.evidence.filter((evidence) => discovered.has(evidence.id));
  const selectedEvidence = caseFile.evidence.find((evidence) => evidence.id === selectedEvidenceId && discovered.has(evidence.id));
  const latestHint = progress.hintsUsed > 0 ? caseFile.hints[Math.min(progress.hintsUsed - 1, caseFile.hints.length - 1)] : null;
  const nextHint = caseFile.hints[progress.hintsUsed];
  const accusation: Accusation = { suspectId: selectedSuspectId, methodEvidenceId, motiveEvidenceId };
  const accusationReady = Boolean(selectedSuspectId && methodEvidenceId && motiveEvidenceId && discovered.has(methodEvidenceId) && discovered.has(motiveEvidenceId));

  const examine = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    onExamine(evidenceId);
  };

  return (
    <main className="page-shell workspace-screen">
      <div className="workspace-return"><button className="back-link" type="button" onClick={onBack}><ArrowLeft size={15} /> All case files</button><span className="file-id">FILE {caseFile.caseNumber} <span>·</span> {caseFile.crime.toUpperCase()}</span></div>

      <section className="dossier-header" aria-labelledby="case-title">
        <div className="dossier-title-block"><p className="eyebrow"><span className="eyebrow-line" /> Active investigation <span className="eyebrow-separator">/</span> {caseFile.complexity}</p><h1 id="case-title">{caseFile.title}</h1><p className="dossier-subtitle">{caseFile.subtitle}</p></div>
        <div className="dossier-location"><span className="location-pin"><MapPin size={17} /></span><span><small>LOCATION</small><strong>{caseFile.location}</strong></span></div>
        <p className="dossier-brief">{caseFile.brief}</p>
        <div className="case-progress-bar"><div className="progress-label"><span><Search size={14} /> Evidence examined</span><strong>{collectedEvidence.length} <span>/ {caseFile.evidence.length}</span></strong></div><progress value={collectedEvidence.length} max={caseFile.evidence.length}>{collectedEvidence.length}/{caseFile.evidence.length}</progress></div>
      </section>

      {progress.result && <SolutionPanel caseFile={caseFile} score={progress.result.score} onShare={onShare} onBack={onBack} />}

      <div className="workspace-layout">
        <div className="workspace-main">
          <section className="workspace-section" aria-labelledby="evidence-title">
            <div className="workspace-section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> 01 <span className="eyebrow-separator">/</span> The scene</p><h2 id="evidence-title">Evidence board</h2></div><span className="section-count">{collectedEvidence.length.toString().padStart(2, '0')} logged</span></div>
            <p className="section-intro">Examine each item. Details are added to your case file as you find them.</p>
            <div className="evidence-grid">
              {caseFile.evidence.map((evidence) => (
                <EvidenceCard key={evidence.id} evidence={evidence} discovered={discovered.has(evidence.id)} selected={selectedEvidenceId === evidence.id} hinted={Boolean(latestHint?.evidenceIds.includes(evidence.id))} onExamine={() => examine(evidence.id)} />
              ))}
            </div>
            <article className={`evidence-detail ${selectedEvidence ? 'detail-open' : ''}`} aria-live="polite">
              {selectedEvidence ? <>
                <div className="detail-heading"><span className="detail-icon"><EvidenceGlyph evidence={selectedEvidence} /></span><div><p className="eyebrow">Evidence logged <span className="eyebrow-separator">/</span> {selectedEvidence.kind}</p><h3>{selectedEvidence.title}</h3></div><button type="button" className="detail-close" onClick={() => setSelectedEvidenceId(null)} aria-label="Close evidence details"><X size={17} /></button></div>
                <p className="detail-observation">{selectedEvidence.observation}</p><p className="detail-meaning"><span>What it suggests</span>{selectedEvidence.meaning}</p>
              </> : <div className="detail-empty"><Search size={17} /><span>Choose an item above to examine it.</span></div>}
            </article>
          </section>

          <section className="workspace-section suspects-section" aria-labelledby="suspect-title">
            <div className="workspace-section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> 02 <span className="eyebrow-separator">/</span> The people</p><h2 id="suspect-title">Suspect profiles</h2></div><span className="section-count">{caseFile.suspects.length.toString().padStart(2, '0')} persons of interest</span></div>
            <p className="section-intro">Read each account. Keep what they say beside what the evidence shows.</p>
            <div className="suspect-grid">
              {caseFile.suspects.map((suspect: Suspect) => (
                <SuspectCard key={suspect.id} suspect={suspect} selected={selectedSuspectId === suspect.id} interviewed={progress.interviewedSuspectIds.includes(suspect.id)} onSelect={() => setSelectedSuspectId(suspect.id)} onInterview={() => onInterview(suspect.id)} />
              ))}
            </div>
          </section>

          <section className="workspace-section deduction-section" aria-labelledby="deduction-title">
            <div className="workspace-section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> 03 <span className="eyebrow-separator">/</span> Your conclusion</p><h2 id="deduction-title">Make the accusation</h2></div><span className="section-count">{progress.wrongAccusations} {progress.wrongAccusations === 1 ? 'misstep' : 'missteps'}</span></div>
            <p className="section-intro">Name the person and present two clues: one for how it happened, one for why.</p>
            <div className="deduction-form">
              <label className="field-label" htmlFor="culprit-select">Who is responsible?</label>
              <select id="culprit-select" value={selectedSuspectId} onChange={(event) => setSelectedSuspectId(event.target.value)} disabled={isSolved}>
                <option value="">Choose a suspect</option>
                {caseFile.suspects.map((suspect) => <option key={suspect.id} value={suspect.id}>{suspect.name} · {suspect.role}</option>)}
              </select>
              <div className="deduction-evidence-fields">
                <label className="select-field"><span className="field-label">The method</span><select value={methodEvidenceId} onChange={(event) => setMethodEvidenceId(event.target.value)} disabled={isSolved || collectedEvidence.length === 0}><option value="">Choose collected evidence</option>{collectedEvidence.map((evidence) => <option key={evidence.id} value={evidence.id}>{evidence.title}</option>)}</select></label>
                <label className="select-field"><span className="field-label">The motive</span><select value={motiveEvidenceId} onChange={(event) => setMotiveEvidenceId(event.target.value)} disabled={isSolved || collectedEvidence.length === 0}><option value="">Choose collected evidence</option>{collectedEvidence.map((evidence) => <option key={evidence.id} value={evidence.id}>{evidence.title}</option>)}</select></label>
              </div>
              <div className="accusation-footer"><span className="accusation-explainer"><ShieldCheck size={15} /> Only evidence you have examined can be presented.</span><button className="primary-button" type="button" disabled={!accusationReady || isSolved} onClick={() => onAccuse(accusation)}>Present accusation <ArrowUpRight size={16} /></button></div>
              {feedback && <p className={`accusation-feedback ${isSolved ? 'feedback-success' : ''}`} role="status" aria-live="polite">{isSolved ? <CheckCircle2 size={15} /> : <X size={15} />}{feedback}</p>}
            </div>
          </section>
        </div>

        <aside className="workspace-aside" aria-label="Detective tools">
          <section className="aside-card hint-card" aria-labelledby="hint-title">
            <div className="aside-heading"><span className="aside-icon"><Lightbulb size={16} /></span><div><p className="aside-kicker">Need a nudge?</p><h2 id="hint-title">Ask for a hint</h2></div></div>
            <p className="aside-copy">Hints point you toward the right evidence without naming the culprit.</p>
            {latestHint && <div className="hint-reveal"><span>HINT {progress.hintsUsed} <span>·</span> {difficulty === 'story' ? 'NO SCORE COST' : `−${getHintCost(difficulty)} PTS`}</span><p>{latestHint.text}</p></div>}
            <button className="hint-button" type="button" onClick={onHint} disabled={isSolved || !nextHint}>
              {nextHint ? <><Lightbulb size={15} /> {progress.hintsUsed === 0 ? 'Reveal first hint' : 'Reveal next hint'} <ArrowUpRight size={14} /></> : <><Check size={15} /> All hints revealed</>}
            </button>
            <span className="hint-remaining">{Math.max(0, caseFile.hints.length - progress.hintsUsed)} of {caseFile.hints.length} remaining</span>
          </section>

          <section className="aside-card notebook-card" aria-labelledby="notebook-title">
            <div className="aside-heading"><span className="aside-icon"><NotebookPen size={16} /></span><div><p className="aside-kicker">Private field notes</p><h2 id="notebook-title">Detective’s notebook</h2></div></div>
            <label className="sr-only" htmlFor="detective-notes">Your notes for {caseFile.title}</label>
            <textarea id="detective-notes" value={progress.notes} maxLength={5000} onChange={(event) => onNoteChange(event.target.value)} placeholder="Write down a theory, a name, or a detail to revisit…" />
            <div className="notebook-footer"><span>Saved on this device</span><span>{progress.notes.length}/5000</span></div>
          </section>

          <section className="aside-card timeline-card" aria-labelledby="timeline-title">
            <div className="aside-heading"><span className="aside-icon"><Clock3 size={16} /></span><div><p className="aside-kicker">Sequence of events</p><h2 id="timeline-title">Case timeline</h2></div></div>
            <ol className="case-timeline">{caseFile.timeline.map((item) => <li key={`${item.time}-${item.label}`}><time>{item.time}</time><div><strong>{item.label}</strong><p>{item.detail}</p></div></li>)}</ol>
          </section>

          <section className="aside-card activity-card" aria-labelledby="activity-title">
            <div className="aside-heading"><span className="aside-icon"><BookOpen size={16} /></span><div><p className="aside-kicker">Your investigation</p><h2 id="activity-title">Field log</h2></div></div>
            {progress.activity.length === 0 ? <p className="empty-activity">Your actions in this case will appear here.</p> : <ol className="activity-list">{[...progress.activity].reverse().slice(0, 8).map((item) => <li key={item.id}><time>{formatActivityTime(item.at)}</time><span>{item.message}</span></li>)}</ol>}
          </section>
        </aside>
      </div>
    </main>
  );
}
