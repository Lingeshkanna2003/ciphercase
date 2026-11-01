import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, Check, CheckCircle2, Clock3,
  DoorOpen, FileText, Fingerprint, Footprints, KeyRound, Lightbulb, MapPin,
  NotebookPen, Search, ShieldCheck, Ticket, UserRound, X,
} from 'lucide-react';
import type { Accusation, CaseFile, CaseProgress, Difficulty, Evidence, Suspect } from '../types/game';
import { getHintCost } from '../lib/caseEngine';
import DeductionBoard from './DeductionBoard';
import CaseEnvironment from './CaseEnvironment';
import EvidenceArtifact from './EvidenceArtifact';

interface CaseWorkspaceProps {
  caseFile: CaseFile;
  progress: CaseProgress;
  difficulty: Difficulty;
  feedback: string;
  onBack: () => void;
  onExamine: (evidenceId: string) => void;
  onConnectEvidence: (connectionId: string) => void;
  onBoardOrderChange: (evidenceIds: string[]) => void;
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
          {interviewed && <div className="interview-transcript" role="status"><small>STATEMENT IN THE FIELD LOG</small><p>{suspect.alibi}</p><small>INVESTIGATOR’S NOTE</small><p>{suspect.detail}</p></div>}
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

export default function CaseWorkspace({ caseFile, progress, difficulty, feedback, onBack, onExamine, onConnectEvidence, onBoardOrderChange, onInterview, onNoteChange, onHint, onAccuse, onShare }: CaseWorkspaceProps) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(progress.discoveredEvidenceIds[0] ?? null);
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'unexamined' | 'collected'>('all');
  const [selectedSuspectId, setSelectedSuspectId] = useState('');
  const [methodEvidenceId, setMethodEvidenceId] = useState('');
  const [motiveEvidenceId, setMotiveEvidenceId] = useState('');
  const [inspectionFace, setInspectionFace] = useState<'observation' | 'interpretation'>('observation');
  const [inspectionZoomed, setInspectionZoomed] = useState(false);
  const [newEvidenceId, setNewEvidenceId] = useState<string | null>(null);
  const previousEvidenceCount = useRef(progress.discoveredEvidenceIds.length);
  const discoveryTimer = useRef<number | undefined>(undefined);
  const isSolved = Boolean(progress.result);
  const discovered = new Set(progress.discoveredEvidenceIds);
  const collectedEvidence = caseFile.evidence.filter((evidence) => discovered.has(evidence.id));
  const visibleEvidence = useMemo(() => caseFile.evidence.filter((evidence) => evidenceFilter === 'all' || (evidenceFilter === 'collected' ? discovered.has(evidence.id) : !discovered.has(evidence.id))), [caseFile.evidence, evidenceFilter, progress.discoveredEvidenceIds]);
  const selectedEvidence = caseFile.evidence.find((evidence) => evidence.id === selectedEvidenceId && discovered.has(evidence.id));
  const latestHint = progress.hintsUsed > 0 ? caseFile.hints[Math.min(progress.hintsUsed - 1, caseFile.hints.length - 1)] : null;
  const nextHint = caseFile.hints[progress.hintsUsed];
  const accusation: Accusation = { suspectId: selectedSuspectId, methodEvidenceId, motiveEvidenceId };
  const accusationReady = Boolean(selectedSuspectId && methodEvidenceId && motiveEvidenceId && discovered.has(methodEvidenceId) && discovered.has(motiveEvidenceId));
  const selectedSuspect = caseFile.suspects.find((suspect) => suspect.id === selectedSuspectId);
  const methodEvidence = collectedEvidence.find((evidence) => evidence.id === methodEvidenceId);
  const motiveEvidence = collectedEvidence.find((evidence) => evidence.id === motiveEvidenceId);

  useEffect(() => {
    const count = progress.discoveredEvidenceIds.length;
    if (count > previousEvidenceCount.current) {
      setNewEvidenceId(progress.discoveredEvidenceIds[count - 1]);
      if (discoveryTimer.current) window.clearTimeout(discoveryTimer.current);
      discoveryTimer.current = window.setTimeout(() => setNewEvidenceId(null), 3800);
    }
    previousEvidenceCount.current = count;
    return () => { if (discoveryTimer.current) window.clearTimeout(discoveryTimer.current); };
  }, [progress.discoveredEvidenceIds]);

  const examine = (evidenceId: string) => {
    if (evidenceId !== selectedEvidenceId) {
      setInspectionFace('observation');
      setInspectionZoomed(false);
    }
    setSelectedEvidenceId(evidenceId);
    onExamine(evidenceId);
  };

  return (
    <main className="page-shell workspace-screen">
      <div className="workspace-return"><button className="back-link" type="button" onClick={onBack}><ArrowLeft size={15} /> All case files</button><span className="file-id">FILE {caseFile.caseNumber} <span>·</span> {caseFile.crime.toUpperCase()}</span></div>

      <section className="dossier-header" aria-labelledby="case-title">
        <div className="dossier-title-block"><p className="eyebrow"><span className="eyebrow-line" /> Active investigation <span className="eyebrow-separator">/</span> {caseFile.complexity}</p><h1 id="case-title">{caseFile.title}</h1><p className="dossier-subtitle">{caseFile.subtitle}</p></div>
        <div className="dossier-visual"><CaseEnvironment caseId={caseFile.id} compact eager /><div className="dossier-location"><span className="location-pin"><MapPin size={17} /></span><span><small>LOCATION</small><strong>{caseFile.location}</strong></span></div></div>
        <p className="dossier-brief">{caseFile.brief}</p>
        <div className="case-progress-bar"><div className="progress-label"><span><Search size={14} /> Evidence examined</span><strong>{collectedEvidence.length} <span>/ {caseFile.evidence.length}</span></strong></div><progress value={collectedEvidence.length} max={caseFile.evidence.length}>{collectedEvidence.length}/{caseFile.evidence.length}</progress></div>
      </section>

      <nav className="investigation-steps" aria-label="Investigation sections">
        <a className={collectedEvidence.length ? 'step-active' : ''} href="#evidence-title"><span>01</span><i /> Inspect the scene</a>
        <a className={progress.interviewedSuspectIds.length ? 'step-active' : ''} href="#suspect-title"><span>02</span><i /> Question the people</a>
        <a className={progress.result ? 'step-active' : ''} href="#deduction-title"><span>03</span><i /> Make your call</a>
      </nav>
      {newEvidenceId && typeof document !== 'undefined' && createPortal(<div className="discovery-toast" role="status" aria-live="polite"><span className="discovery-toast-mark"><CheckCircle2 size={16} /></span><span><small>Evidence added</small><strong>{caseFile.evidence.find((item) => item.id === newEvidenceId)?.title}</strong></span></div>, document.body)}

      {progress.result && <SolutionPanel caseFile={caseFile} score={progress.result.score} onShare={onShare} onBack={onBack} />}

      <div className="workspace-layout">
        <div className="workspace-main">
          <section className="workspace-section" aria-labelledby="evidence-title">
            <div className="workspace-section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> 01 <span className="eyebrow-separator">/</span> The scene</p><h2 id="evidence-title">Evidence board</h2></div><span className="section-count">{collectedEvidence.length.toString().padStart(2, '0')} logged</span></div>
            <p className="section-intro">Examine each clue to add it to your file.</p>
            <div className="evidence-toolbar" role="group" aria-label="Filter evidence">
              <span className="evidence-toolbar-label"><Search size={14} /> Filter clues</span>
              <div className="evidence-filters">
                {([{ id: 'all', label: 'All clues', count: caseFile.evidence.length }, { id: 'unexamined', label: 'Unexamined', count: caseFile.evidence.length - collectedEvidence.length }, { id: 'collected', label: 'On file', count: collectedEvidence.length }] as const).map((filter) => (
                  <button key={filter.id} type="button" className={evidenceFilter === filter.id ? 'filter-active' : ''} aria-pressed={evidenceFilter === filter.id} onClick={() => setEvidenceFilter(filter.id)}>{filter.label}<span>{filter.count}</span></button>
                ))}
              </div>
            </div>
            <div className="evidence-grid">
              {visibleEvidence.map((evidence) => (
                <EvidenceCard key={evidence.id} evidence={evidence} discovered={discovered.has(evidence.id)} selected={selectedEvidenceId === evidence.id} hinted={Boolean(latestHint?.evidenceIds.includes(evidence.id))} onExamine={() => examine(evidence.id)} />
              ))}
            </div>
            {visibleEvidence.length === 0 && <div className="evidence-filter-empty"><CheckCircle2 size={17} /> Every clue is in your file. The scene is fully examined.</div>}
            <article className={`evidence-detail ${selectedEvidence ? 'detail-open' : ''}`} aria-live="polite">
              {selectedEvidence ? <>
                <div className="detail-heading"><span className="detail-icon"><EvidenceGlyph evidence={selectedEvidence} /></span><div><p className="eyebrow">Evidence logged <span className="eyebrow-separator">/</span> {selectedEvidence.kind}</p><h3>{selectedEvidence.title}</h3></div><button type="button" className="detail-close" onClick={() => setSelectedEvidenceId(null)} aria-label="Close evidence details"><X size={17} /></button></div>
                <div className={`evidence-inspection ${inspectionZoomed ? 'inspection-zoomed' : ''}`}>
                  <EvidenceArtifact icon={selectedEvidence.icon} title={selectedEvidence.title} />
                  <div className="inspection-reading"><small>{inspectionFace === 'observation' ? 'OBSERVATION' : 'WHAT IT SUGGESTS'}</small><p>{inspectionFace === 'observation' ? selectedEvidence.observation : selectedEvidence.meaning}</p><div className="inspection-controls"><button type="button" onClick={() => setInspectionFace((face) => face === 'observation' ? 'interpretation' : 'observation')}>{inspectionFace === 'observation' ? 'Turn the evidence over' : 'Return to observation'}</button><button type="button" onClick={() => setInspectionZoomed((zoomed) => !zoomed)}>{inspectionZoomed ? 'Fit in view' : 'Inspect close'}</button></div></div>
                </div>
              </> : <div className="detail-empty"><Search size={17} /><span>Choose an item above to examine it.</span></div>}
            </article>
            <DeductionBoard evidence={collectedEvidence} suspects={caseFile.suspects} connections={caseFile.connections} discoveredConnectionIds={progress.discoveredConnectionIds} order={progress.boardOrder} onConnect={onConnectEvidence} onOrderChange={onBoardOrderChange} />
          </section>

          <section className="workspace-section suspects-section" aria-labelledby="suspect-title">
            <div className="workspace-section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> 02 <span className="eyebrow-separator">/</span> The people</p><h2 id="suspect-title">Suspect profiles</h2></div></div>
            <div className="suspect-grid">
              {caseFile.suspects.map((suspect: Suspect) => (
                <SuspectCard key={suspect.id} suspect={suspect} selected={selectedSuspectId === suspect.id} interviewed={progress.interviewedSuspectIds.includes(suspect.id)} onSelect={() => setSelectedSuspectId(suspect.id)} onInterview={() => onInterview(suspect.id)} />
              ))}
            </div>
          </section>

          <section className="workspace-section deduction-section" aria-labelledby="deduction-title">
            <div className="workspace-section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> 03 <span className="eyebrow-separator">/</span> Your conclusion</p><h2 id="deduction-title">Make the accusation</h2></div>{progress.wrongAccusations > 0 && <span className="section-count">{progress.wrongAccusations} {progress.wrongAccusations === 1 ? 'misstep' : 'missteps'}</span>}</div>
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
              <div className={`theory-preview ${accusationReady ? 'theory-ready' : ''}`} aria-live="polite">
                <div className="theory-copy"><small>Your theory</small><strong>{selectedSuspect ? selectedSuspect.name : 'A suspect'} <i>·</i> {methodEvidence ? methodEvidence.title : 'method clue'} <i>·</i> {motiveEvidence ? motiveEvidence.title : 'motive clue'}</strong></div>
              </div>
              <div className="accusation-footer"><span className="accusation-explainer"><ShieldCheck size={15} /> Only evidence you have examined can be presented.</span><button className="primary-button" type="button" disabled={!accusationReady || isSolved} onClick={() => onAccuse(accusation)}>Present accusation <ArrowUpRight size={16} /></button></div>
              {feedback && <p className={`accusation-feedback ${isSolved ? 'feedback-success' : ''}`} role="status" aria-live="polite">{isSolved ? <CheckCircle2 size={15} /> : <X size={15} />}{feedback}</p>}
            </div>
          </section>
        </div>

        <aside className="workspace-aside" aria-label="Detective tools">
          <section className="aside-card hint-card" aria-labelledby="hint-title">
            <div className="aside-heading"><span className="aside-icon"><Lightbulb size={16} /></span><div><h2 id="hint-title">Hints</h2></div></div>
            <p className="aside-copy">Get a pointer to useful evidence.</p>
            {latestHint && <div className="hint-reveal"><span>HINT {progress.hintsUsed} <span>·</span> {difficulty === 'story' ? 'NO SCORE COST' : `−${getHintCost(difficulty)} PTS`}</span><p>{latestHint.text}</p></div>}
            <button className="hint-button" type="button" onClick={onHint} disabled={isSolved || !nextHint}>
              {nextHint ? <><Lightbulb size={15} /> {progress.hintsUsed === 0 ? 'Reveal first hint' : 'Reveal next hint'} <ArrowUpRight size={14} /></> : <><Check size={15} /> All hints revealed</>}
            </button>
            <span className="hint-remaining">{Math.max(0, caseFile.hints.length - progress.hintsUsed)} of {caseFile.hints.length} remaining</span>
          </section>

          <section className="aside-card notebook-card" aria-labelledby="notebook-title">
            <div className="aside-heading"><span className="aside-icon"><NotebookPen size={16} /></span><div><h2 id="notebook-title">Notes</h2></div></div>
            <label className="sr-only" htmlFor="detective-notes">Your notes for {caseFile.title}</label>
            <textarea id="detective-notes" value={progress.notes} maxLength={5000} onChange={(event) => onNoteChange(event.target.value)} placeholder="Keep a theory or detail here…" />
          </section>

          <section className="aside-card timeline-card" aria-labelledby="timeline-title">
            <div className="aside-heading"><span className="aside-icon"><Clock3 size={16} /></span><div><h2 id="timeline-title">Timeline</h2></div></div>
            <ol className="case-timeline">{caseFile.timeline.map((item) => <li key={`${item.time}-${item.label}`}><time>{item.time}</time><div><strong>{item.label}</strong><p>{item.detail}</p></div></li>)}</ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
